import { FULL_TURN, POINTER_ANGLE } from '@/features/spin/constants';
import { calculateSegmentAngles, calculateTargetRotation } from '@/features/spin/engine/spinEngine';
import type { WheelItem } from '@/types/wheel';

import { degreesToRadians, pointerSegmentIndex } from '@/features/spin/utils/pointerSegmentIndex';

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

describe('pointerSegmentIndex', () => {
  it('returns -1 when there are no segments', () => {
    expect(pointerSegmentIndex(0, [])).toBe(-1);
  });

  it('points at the first segment before the wheel moves', () => {
    const segments = calculateSegmentAngles([item('Pizza'), item('Burger')]);
    expect(pointerSegmentIndex(0, segments)).toBe(0);
    expect(segments[0]?.startAngle).toBeCloseTo(POINTER_ANGLE);
  });

  it('matches the engine landing for a chosen segment', () => {
    const segments = calculateSegmentAngles([item('Pizza'), item('Burger'), item('Sushi')]);
    const burger = segments[1];
    expect(burger).toBeDefined();
    const rotation = calculateTargetRotation(burger!);

    expect(pointerSegmentIndex(rotation, segments)).toBe(1);
  });

  it('matches engine landings at the start and end of a weighted slice', () => {
    const segments = calculateSegmentAngles([
      item('Pizza', { weight: 1 }),
      item('Burger', { weight: 2 }),
      item('Sushi', { weight: 1 }),
    ]);
    const burger = segments[1]!;
    const atStart = calculateTargetRotation(burger, { fullRotations: 3, landing: 0 });
    const atEnd = calculateTargetRotation(burger, { fullRotations: 3, landing: 1 });

    expect(pointerSegmentIndex(atStart, segments)).toBe(1);
    expect(pointerSegmentIndex(atEnd, segments)).toBe(1);
  });

  it('converts degrees to radians', () => {
    expect(degreesToRadians(0)).toBe(0);
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    expect(degreesToRadians(-90)).toBeCloseTo(-Math.PI / 2);
  });

  it('falls back to the last segment when none contain the pointer', () => {
    expect(
      pointerSegmentIndex(0, [
        { startAngle: 0, endAngle: 0.1 },
        { startAngle: 0.1, endAngle: 0.2 },
      ]),
    ).toBe(1);
  });

  it('matches a wrap-around slice on both sides of zero', () => {
    const wrap = [{ startAngle: POINTER_ANGLE, endAngle: POINTER_ANGLE + Math.PI }];

    expect(pointerSegmentIndex(0, wrap)).toBe(0);
    expect(pointerSegmentIndex(-Math.PI / 2, wrap)).toBe(0);
    expect(pointerSegmentIndex(FULL_TURN, wrap)).toBe(0);
  });

  it('keeps near-edge landings inside the winning slice', () => {
    const segments = calculateSegmentAngles([
      item('Pizza', { weight: 1 }),
      item('Burger', { weight: 1 }),
      item('Sushi', { weight: 1 }),
    ]);
    const pizza = segments[0]!;
    const burger = segments[1]!;

    const nearPizzaEnd = calculateTargetRotation(pizza, { fullRotations: 2, landing: 0.999 });
    const nearBurgerStart = calculateTargetRotation(burger, { fullRotations: 2, landing: 0.001 });
    const nearBurgerEnd = calculateTargetRotation(burger, { fullRotations: 2, landing: 0.999 });

    expect(pointerSegmentIndex(nearPizzaEnd, segments)).toBe(0);
    expect(pointerSegmentIndex(nearBurgerStart, segments)).toBe(1);
    expect(pointerSegmentIndex(nearBurgerEnd, segments)).toBe(1);
  });
});
