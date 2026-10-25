import type { WheelItem } from '@/types/wheel';
import {
  selectWeightedItem,
  WEIGHTED_SELECTION_ERRORS,
} from '@/utils/selectWeightedItem';

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

const pizza = item('Pizza', { weight: 1 });
const burger = item('Burger', { weight: 2 });
const sushi = item('Sushi', { weight: 1 });
const food = [pizza, burger, sushi];

describe('selectWeightedItem', () => {
  it('selects in proportion to weight for the food example', () => {
    expect(selectWeightedItem(food, 0)).toBe(pizza);
    expect(selectWeightedItem(food, 0.249)).toBe(pizza);
    expect(selectWeightedItem(food, 0.25)).toBe(burger);
    expect(selectWeightedItem(food, 0.5)).toBe(burger);
    expect(selectWeightedItem(food, 0.749)).toBe(burger);
    expect(selectWeightedItem(food, 0.75)).toBe(sushi);
    expect(selectWeightedItem(food, 1)).toBe(sushi);
  });

  it('uses an injected random function instead of Math.random', () => {
    const randomValue = vi.fn(() => 0.5);

    expect(selectWeightedItem(food, randomValue)).toBe(burger);
    expect(randomValue).toHaveBeenCalledTimes(1);
  });

  it('is deterministic for the same injected value', () => {
    const first = Array.from({ length: 8 }, () => selectWeightedItem(food, 0.3));
    const second = Array.from({ length: 8 }, () => selectWeightedItem(food, 0.3));

    expect(first.every((entry) => entry === burger)).toBe(true);
    expect(second).toEqual(first);
  });

  it('ignores disabled items even when they have a larger weight', () => {
    const items = [item('Pizza', { weight: 8, enabled: false }), burger, sushi];

    expect(selectWeightedItem(items, 0)).toBe(burger);
    expect(selectWeightedItem(items, 0.66)).toBe(burger);
    expect(selectWeightedItem(items, 0.67)).toBe(sushi);
  });

  it('returns undefined when every item is disabled', () => {
    expect(
      selectWeightedItem(
        [
          item('Pizza', { enabled: false }),
          item('Burger', { enabled: false, weight: 4 }),
        ],
        0.5,
      ),
    ).toBeUndefined();
  });

  it('returns undefined for an empty list', () => {
    expect(selectWeightedItem([], 0.5)).toBeUndefined();
  });

  it('never selects a zero-weight item when others have weight', () => {
    const skipped = item('Salad', { weight: 0 });
    const items = [pizza, skipped, burger];

    expect(selectWeightedItem(items, 0)).toBe(pizza);
    expect(selectWeightedItem(items, 0.33)).toBe(pizza);
    expect(selectWeightedItem(items, 0.34)).toBe(burger);
    expect(selectWeightedItem(items, 1)).toBe(burger);
  });

  it('returns undefined when every enabled weight is zero', () => {
    expect(
      selectWeightedItem(
        [item('Pizza', { weight: 0 }), item('Burger', { weight: 0, enabled: false }), item('Sushi', { weight: 0 })],
        0.5,
      ),
    ).toBeUndefined();
  });

  it('rejects negative enabled weights', () => {
    expect(() => selectWeightedItem([pizza, item('Burger', { weight: -1 })], 0.5)).toThrow(
      WEIGHTED_SELECTION_ERRORS.invalidWeight,
    );
  });

  it('rejects non-finite enabled weights', () => {
    expect(() => selectWeightedItem([item('Pizza', { weight: Number.NaN })], 0)).toThrow(
      WEIGHTED_SELECTION_ERRORS.invalidWeight,
    );
    expect(() => selectWeightedItem([item('Pizza', { weight: Number.POSITIVE_INFINITY })], 0)).toThrow(
      WEIGHTED_SELECTION_ERRORS.invalidWeight,
    );
  });

  it('does not validate disabled items with invalid weights', () => {
    expect(selectWeightedItem([item('Broken', { enabled: false, weight: -8 }), sushi], 0)).toBe(sushi);
  });

  it('rejects an out-of-range random value', () => {
    expect(() => selectWeightedItem(food, -0.01)).toThrow(WEIGHTED_SELECTION_ERRORS.invalidRandom);
    expect(() => selectWeightedItem(food, 1.01)).toThrow(WEIGHTED_SELECTION_ERRORS.invalidRandom);
    expect(() => selectWeightedItem(food, Number.NaN)).toThrow(WEIGHTED_SELECTION_ERRORS.invalidRandom);
    expect(() => selectWeightedItem(food, () => 2)).toThrow(WEIGHTED_SELECTION_ERRORS.invalidRandom);
  });

  it('selects the only enabled positive-weight item for any valid random value', () => {
    const items = [item('Pizza', { enabled: false }), burger, item('Sushi', { weight: 0 })];

    expect(selectWeightedItem(items, 0)).toBe(burger);
    expect(selectWeightedItem(items, 0.5)).toBe(burger);
    expect(selectWeightedItem(items, 1)).toBe(burger);
  });

  it('supports fractional weights', () => {
    const light = item('Light', { weight: 0.5 });
    const heavy = item('Heavy', { weight: 1.5 });

    expect(selectWeightedItem([light, heavy], 0.24)).toBe(light);
    expect(selectWeightedItem([light, heavy], 0.25)).toBe(heavy);
  });

  it('does not walk into children; it selects from the given list only', () => {
    const nested = item('Pizza', {
      weight: 1,
      children: [item('Chicken', { weight: 99 })],
    });

    expect(selectWeightedItem([nested, burger], 0)).toBe(nested);
    expect(selectWeightedItem([nested, burger], 0)).not.toBe(nested.children?.[0]);
  });

  it('returns the same item instance that was passed in', () => {
    const selected = selectWeightedItem(food, 0.5);

    expect(selected).toBe(burger);
  });
});
