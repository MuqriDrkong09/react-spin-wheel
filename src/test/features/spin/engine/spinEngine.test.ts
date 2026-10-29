import { FULL_TURN, POINTER_ANGLE } from '@/features/spin/constants';
import {
  activeWheelItems,
  calculateSegmentAngles,
  calculateTargetRotation,
  createSpinResult,
  isActiveWheelSegment,
  landingAngle,
  selectWinner,
  SPIN_ENGINE_ERRORS,
} from '@/features/spin/engine/spinEngine';
import { buildWheelGeometry } from '@/features/spin/utils/wheelGeometry';
import type { WheelItem } from '@/types/wheel';
import * as weightedSelection from '@/utils/selectWeightedItem';
import { WEIGHTED_SELECTION_ERRORS } from '@/utils/selectWeightedItem';

function item(name: string, extra?: Partial<WheelItem>): WheelItem {
  return {
    id: name.toLowerCase(),
    name,
    color: '#4f46e5',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

const pizza = item('Pizza', { weight: 1, color: '#ea580c' });
const burger = item('Burger', { weight: 2, color: '#ca8a04' });
const sushi = item('Sushi', { weight: 1, color: '#0f766e' });
const food = [pizza, burger, sushi];

function pointsAtPointer(wheelAngle: number, rotation: number): boolean {
  const landed = wheelAngle + rotation;
  return (
    Math.abs(Math.cos(landed) - Math.cos(POINTER_ANGLE)) < 1e-9 &&
    Math.abs(Math.sin(landed) - Math.sin(POINTER_ANGLE)) < 1e-9
  );
}

describe('calculateSegmentAngles', () => {
  it('returns no segments for an empty list', () => {
    expect(calculateSegmentAngles([])).toEqual([]);
  });

  it('starts at the pointer and sizes slices by weight', () => {
    const segments = calculateSegmentAngles(food);

    expect(segments).toHaveLength(3);
    expect(segments[0]?.item).toBe(pizza);
    expect(segments[0]?.startAngle).toBeCloseTo(POINTER_ANGLE);
    expect(segments[0]?.sweepAngle).toBeCloseTo(FULL_TURN / 4);
    expect(segments[1]?.item).toBe(burger);
    expect(segments[1]?.sweepAngle).toBeCloseTo(FULL_TURN / 2);
    expect(segments[2]?.item).toBe(sushi);
    expect(segments[2]?.sweepAngle).toBeCloseTo(FULL_TURN / 4);
    expect(segments.reduce((sum, segment) => sum + segment.sweepAngle, 0)).toBeCloseTo(FULL_TURN);
  });

  it('uses a full turn for a single active item', () => {
    const [segment] = calculateSegmentAngles([pizza]);

    expect(segment?.sweepAngle).toBeCloseTo(FULL_TURN);
    expect(segment?.startAngle).toBeCloseTo(POINTER_ANGLE);
    expect(segment?.endAngle).toBeCloseTo(POINTER_ANGLE + FULL_TURN);
    expect(segment?.midAngle).toBeCloseTo(POINTER_ANGLE + Math.PI);
  });

  it('excludes disabled, zero-weight, and invalid-weight items', () => {
    const segments = calculateSegmentAngles([
      pizza,
      item('Salad', { enabled: false, weight: 8 }),
      item('Zero', { weight: 0 }),
      item('Broken', { weight: Number.NaN }),
      sushi,
    ]);

    expect(segments.map((segment) => segment.item.id)).toEqual(['pizza', 'sushi']);
    expect(segments[0]?.sweepAngle).toBeCloseTo(FULL_TURN / 2);
  });

  it('does not flatten nested children into extra segments', () => {
    const nested = item('Pizza', { children: [item('Chicken', { weight: 9 })] });
    const segments = calculateSegmentAngles([nested, burger]);

    expect(segments.map((segment) => segment.item.id)).toEqual(['pizza', 'burger']);
  });

  it('matches the visual wheel geometry angles', () => {
    const segments = calculateSegmentAngles(food);
    const geometry = buildWheelGeometry(food);

    expect(geometry.segments).toHaveLength(segments.length);
    for (const [index, segment] of segments.entries()) {
      expect(geometry.segments[index]?.startAngle).toBeCloseTo(segment.startAngle);
      expect(geometry.segments[index]?.endAngle).toBeCloseTo(segment.endAngle);
      expect(geometry.segments[index]?.sweepAngle).toBeCloseTo(segment.sweepAngle);
    }
  });
});

describe('selectWinner', () => {
  it('selects in proportion to weight', () => {
    expect(selectWinner(food, 0)).toBe(pizza);
    expect(selectWinner(food, 0.249)).toBe(pizza);
    expect(selectWinner(food, 0.25)).toBe(burger);
    expect(selectWinner(food, 0.749)).toBe(burger);
    expect(selectWinner(food, 0.75)).toBe(sushi);
    expect(selectWinner(food, 1)).toBe(sushi);
  });

  it('uses an injected random function and never calls Math.random', () => {
    const randomValue = vi.fn(() => 0.5);
    const spy = vi.spyOn(Math, 'random');

    expect(selectWinner(food, randomValue)).toBe(burger);
    expect(randomValue).toHaveBeenCalledTimes(1);
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('skips disabled and zero-weight items without throwing on invalid inactive weights', () => {
    const items = [
      item('Salad', { enabled: false, weight: -8 }),
      item('Zero', { weight: 0 }),
      item('Broken', { weight: Number.NaN }),
      burger,
    ];

    expect(selectWinner(items, 0)).toBe(burger);
    expect(selectWinner(items, 1)).toBe(burger);
  });

  it('returns undefined when nothing can be spun', () => {
    expect(selectWinner([], 0.5)).toBeUndefined();
    expect(selectWinner([item('Pizza', { enabled: false })], 0.5)).toBeUndefined();
    expect(selectWinner([item('Pizza', { weight: 0 })], 0.5)).toBeUndefined();
  });

  it('returns the same item instance that was passed in', () => {
    expect(selectWinner(food, 0.5)).toBe(burger);
  });

  it('rejects an out-of-range random value', () => {
    expect(() => selectWinner(food, -0.01)).toThrow(WEIGHTED_SELECTION_ERRORS.invalidRandom);
    expect(() => selectWinner(food, 1.01)).toThrow(WEIGHTED_SELECTION_ERRORS.invalidRandom);
  });
});

describe('calculateTargetRotation', () => {
  const pizzaSegment = calculateSegmentAngles(food)[0]!;
  const burgerSegment = calculateSegmentAngles(food)[1]!;

  it('adds the requested full rotations and lands the slice center on the pointer', () => {
    const rotation = calculateTargetRotation(pizzaSegment, { fullRotations: 4 });

    expect(rotation).toBeGreaterThanOrEqual(4 * FULL_TURN);
    expect(rotation).toBeLessThan(5 * FULL_TURN);
    expect(pointsAtPointer(pizzaSegment.midAngle, rotation)).toBe(true);
  });

  it('lands a weighted slice (Burger) on the pointer', () => {
    const rotation = calculateTargetRotation(burgerSegment, { fullRotations: 5, landing: 0.5 });

    expect(pointsAtPointer(burgerSegment.midAngle, rotation)).toBe(true);
  });

  it('can land at the start or end of a slice', () => {
    const atStart = calculateTargetRotation(pizzaSegment, { fullRotations: 3, landing: 0 });
    const atEnd = calculateTargetRotation(pizzaSegment, { fullRotations: 3, landing: 1 });

    expect(pointsAtPointer(pizzaSegment.startAngle, atStart)).toBe(true);
    expect(pointsAtPointer(pizzaSegment.endAngle, atEnd)).toBe(true);
  });

  it('always spins forward from the current rotation', () => {
    const first = calculateTargetRotation(pizzaSegment, { fullRotations: 4 });
    const second = calculateTargetRotation(burgerSegment, {
      fullRotations: 4,
      currentRotation: first,
    });

    expect(second).toBeGreaterThan(first);
    expect(second - first).toBeGreaterThanOrEqual(4 * FULL_TURN);
    expect(pointsAtPointer(burgerSegment.midAngle, second)).toBe(true);
  });

  it('still completes the requested turns when the winner is already under the pointer', () => {
    const rotation = calculateTargetRotation(
      { startAngle: POINTER_ANGLE, endAngle: POINTER_ANGLE },
      { fullRotations: 4, landing: 0 },
    );

    expect(rotation).toBeCloseTo(4 * FULL_TURN);
    expect(pointsAtPointer(POINTER_ANGLE, rotation)).toBe(true);
  });

  it('allows zero extra rotations', () => {
    const rotation = calculateTargetRotation(pizzaSegment, { fullRotations: 0 });

    expect(rotation).toBeGreaterThanOrEqual(0);
    expect(rotation).toBeLessThan(FULL_TURN);
    expect(pointsAtPointer(pizzaSegment.midAngle, rotation)).toBe(true);
  });

  it('rejects invalid rotation options', () => {
    expect(() => calculateTargetRotation(pizzaSegment, { fullRotations: -1 })).toThrow(
      SPIN_ENGINE_ERRORS.invalidFullRotations,
    );
    expect(() => calculateTargetRotation(pizzaSegment, { fullRotations: Number.POSITIVE_INFINITY })).toThrow(
      SPIN_ENGINE_ERRORS.invalidFullRotations,
    );
    expect(() => calculateTargetRotation(pizzaSegment, { landing: 1.2 })).toThrow(
      SPIN_ENGINE_ERRORS.invalidLanding,
    );
    expect(() => calculateTargetRotation(pizzaSegment, { landing: -0.1 })).toThrow(
      SPIN_ENGINE_ERRORS.invalidLanding,
    );
    expect(() => calculateTargetRotation(pizzaSegment, { landing: Number.NaN })).toThrow(
      SPIN_ENGINE_ERRORS.invalidLanding,
    );
    expect(() => calculateTargetRotation(pizzaSegment, { currentRotation: Number.NaN })).toThrow(
      SPIN_ENGINE_ERRORS.invalidCurrentRotation,
    );
    expect(() =>
      calculateTargetRotation(pizzaSegment, { currentRotation: Number.POSITIVE_INFINITY }),
    ).toThrow(SPIN_ENGINE_ERRORS.invalidCurrentRotation);
  });

  it('honors a custom pointer angle and does not wrap backward from a negative start', () => {
    const withPointer = calculateTargetRotation(pizzaSegment, {
      fullRotations: 2,
      pointerAngle: 0,
      landing: 0,
    });
    const fromBehind = calculateTargetRotation(pizzaSegment, {
      fullRotations: 0,
      currentRotation: -20 * FULL_TURN,
    });

    expect(withPointer).toBeGreaterThanOrEqual(2 * FULL_TURN);
    expect(fromBehind).toBeGreaterThanOrEqual(0);
    expect(fromBehind).toBeLessThan(FULL_TURN);
    expect(pointsAtPointer(pizzaSegment.midAngle, fromBehind)).toBe(true);
  });
});

describe('createSpinResult', () => {
  it('returns the selected item and a rotation that matches its segment', () => {
    const result = createSpinResult(food, { randomValue: 0.5, fullRotations: 6 });

    expect(result?.item).toBe(burger);
    expect(result?.segment.item).toBe(burger);
    expect(result?.fullRotations).toBe(6);
    expect(result?.targetAngle).toBeCloseTo(result!.segment.midAngle);
    expect(pointsAtPointer(result!.targetAngle, result!.rotation)).toBe(true);
    expect(result!.rotation).toBeGreaterThanOrEqual(6 * FULL_TURN);
  });

  it('uses the same angles as the visual wheel', () => {
    const result = createSpinResult(food, { randomValue: 0, fullRotations: 4 });
    const geometry = buildWheelGeometry(food);
    const visual = geometry.segments.find((segment) => segment.id === result?.item.id);

    expect(result?.item).toBe(pizza);
    expect(visual?.startAngle).toBeCloseTo(result!.segment.startAngle);
    expect(visual?.endAngle).toBeCloseTo(result!.segment.endAngle);
  });

  it('picks full rotations inside a configurable min/max range', () => {
    const min = createSpinResult(food, {
      randomValue: 0,
      minRotations: 4,
      maxRotations: 8,
      rotationRandom: 0,
    });
    const max = createSpinResult(food, {
      randomValue: 0,
      minRotations: 4,
      maxRotations: 8,
      rotationRandom: 1,
    });
    const mid = createSpinResult(food, {
      randomValue: 0,
      minRotations: 4,
      maxRotations: 8,
      rotationRandom: 0.5,
    });

    expect(min?.fullRotations).toBe(4);
    expect(max?.fullRotations).toBe(8);
    expect(mid?.fullRotations).toBe(6);
  });

  it('defaults to four full rotations when none are provided', () => {
    const result = createSpinResult(food, { randomValue: 0 });

    expect(result?.fullRotations).toBe(4);
  });

  it('returns undefined when there is no enabled positive-weight item', () => {
    expect(
      createSpinResult([item('Pizza', { enabled: false }), item('Burger', { weight: 0 })], {
        randomValue: 0.2,
      }),
    ).toBeUndefined();
  });

  it('handles a single item as a full wheel', () => {
    const result = createSpinResult([pizza], { randomValue: 1, fullRotations: 2, landing: 0.25 });

    expect(result?.item).toBe(pizza);
    expect(result?.segment.sweepAngle).toBeCloseTo(FULL_TURN);
    expect(pointsAtPointer(result!.targetAngle, result!.rotation)).toBe(true);
  });

  it('does not call Math.random or read browser APIs', () => {
    const mathSpy = vi.spyOn(Math, 'random');
    const cryptoSpy = vi.spyOn(globalThis.crypto, 'randomUUID');

    createSpinResult(food, {
      randomValue: () => 0.1,
      rotationRandom: () => 0.25,
      minRotations: 4,
      maxRotations: 8,
      landing: 0.4,
    });

    expect(mathSpy).not.toHaveBeenCalled();
    expect(cryptoSpy).not.toHaveBeenCalled();
    mathSpy.mockRestore();
    cryptoSpy.mockRestore();
  });

  it('keeps successive spins moving forward', () => {
    const first = createSpinResult(food, { randomValue: 0, fullRotations: 4 });
    const second = createSpinResult(food, {
      randomValue: 0.9,
      fullRotations: 4,
      currentRotation: first?.rotation,
    });

    expect(second!.rotation).toBeGreaterThan(first!.rotation);
    expect(pointsAtPointer(second!.targetAngle, second!.rotation)).toBe(true);
  });

  it('honors an explicit landing inside the winning slice', () => {
    const result = createSpinResult(food, { randomValue: 0, fullRotations: 3, landing: 0.2 });
    const expected = landingAngle(result!.segment, 0.2);

    expect(result?.item).toBe(pizza);
    expect(result?.targetAngle).toBeCloseTo(expected);
    expect(result!.targetAngle).toBeGreaterThan(result!.segment.startAngle);
    expect(result!.targetAngle).toBeLessThan(result!.segment.endAngle);
    expect(pointsAtPointer(expected, result!.rotation)).toBe(true);
  });

  it('rejects a min/max rotation range that is inverted', () => {
    expect(() =>
      createSpinResult(food, { randomValue: 0, minRotations: 8, maxRotations: 4 }),
    ).toThrow(SPIN_ENGINE_ERRORS.invalidRotationRange);
  });

  it('uses equal min and max rotations, and defaults max to min', () => {
    const equal = createSpinResult(food, {
      randomValue: 0,
      minRotations: 5,
      maxRotations: 5,
    });
    const minOnly = createSpinResult(food, { randomValue: 0, minRotations: 7 });
    const sampledDefault = createSpinResult(food, {
      randomValue: 0,
      minRotations: 4,
      maxRotations: 8,
    });

    expect(equal?.fullRotations).toBe(5);
    expect(minOnly?.fullRotations).toBe(7);
    expect(sampledDefault?.fullRotations).toBe(4);
  });

  it('rejects an invalid rotation-random sample', () => {
    const range = { randomValue: 0, minRotations: 4, maxRotations: 8 };

    expect(() => createSpinResult(food, { ...range, rotationRandom: -0.01 })).toThrow(
      WEIGHTED_SELECTION_ERRORS.invalidRandom,
    );
    expect(() => createSpinResult(food, { ...range, rotationRandom: 1.01 })).toThrow(
      WEIGHTED_SELECTION_ERRORS.invalidRandom,
    );
    expect(() => createSpinResult(food, { ...range, rotationRandom: Number.NaN })).toThrow(
      WEIGHTED_SELECTION_ERRORS.invalidRandom,
    );
    expect(() => createSpinResult(food, { ...range, rotationRandom: () => 2 })).toThrow(
      WEIGHTED_SELECTION_ERRORS.invalidRandom,
    );
  });

  it('returns undefined when the selected winner is not on the wheel', () => {
    const spy = vi
      .spyOn(weightedSelection, 'selectWeightedItem')
      .mockReturnValue(item('Ghost'));

    expect(createSpinResult(food, { randomValue: 0 })).toBeUndefined();

    spy.mockRestore();
  });
});

describe('activeWheelItems', () => {
  it('keeps only enabled items with a finite positive weight', () => {
    expect(isActiveWheelSegment(pizza)).toBe(true);
    expect(isActiveWheelSegment(item('Salad', { enabled: false }))).toBe(false);
    expect(isActiveWheelSegment(item('Zero', { weight: 0 }))).toBe(false);
    expect(isActiveWheelSegment(item('Broken', { weight: Number.NaN }))).toBe(false);
    expect(activeWheelItems([pizza, item('Zero', { weight: 0 }), sushi])).toEqual([pizza, sushi]);
  });
});

describe('landingAngle', () => {
  it('defaults to the slice midpoint', () => {
    expect(landingAngle({ startAngle: 10, endAngle: 20 })).toBe(15);
    expect(landingAngle({ startAngle: 0, endAngle: 8 }, 0.25)).toBe(2);
  });
});
