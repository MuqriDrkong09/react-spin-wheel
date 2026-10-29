import { PRESET_ID } from '@/features/presets/constants';
import { getFrozenPresetCatalog, getPreset, listPresets } from '@/features/presets/data/catalog';

describe('preset catalog', () => {
  it('includes food, movie, workout, and team templates with nested food options', () => {
    const presets = listPresets();
    const food = presets.find((preset) => preset.id === PRESET_ID.food);
    const pizza = food?.items.find((item) => item.name === 'Pizza');

    expect(presets.map((preset) => preset.name)).toEqual(['Food', 'Movie', 'Workout', 'Team']);
    expect(food?.items.map((item) => item.name)).toEqual(['Pizza', 'Burger', 'Noodles', 'Sushi']);
    expect(pizza?.children?.map((item) => item.name)).toEqual(['Chicken Pepperoni', 'Beef Pepperoni']);
    expect(presets.find((preset) => preset.id === PRESET_ID.movie)?.items.map((item) => item.name)).toEqual([
      'Action',
      'Comedy',
      'Horror',
      'Sci-Fi',
    ]);
    expect(presets.find((preset) => preset.id === PRESET_ID.workout)?.items.map((item) => item.name)).toEqual([
      'Push Ups',
      'Squats',
      'Running',
      'Cycling',
    ]);
    expect(presets.find((preset) => preset.id === PRESET_ID.team)?.items).toHaveLength(4);
  });

  it('returns clones so callers cannot change the original preset', () => {
    const clone = getPreset(PRESET_ID.food) as
      | {
          name: string;
          items: Array<{ name: string; children?: Array<{ name: string }> }>;
        }
      | undefined;
    expect(clone).toBeDefined();
    if (!clone) {
      return;
    }

    clone.name = 'Dinner';
    const pizza = clone.items[0];
    if (pizza) {
      pizza.name = 'Calzone';
      if (pizza.children?.[0]) {
        pizza.children[0].name = 'Extra Cheese';
      }
    }

    const original = getFrozenPresetCatalog().find((preset) => preset.id === PRESET_ID.food);
    expect(original?.name).toBe('Food');
    expect(original?.items[0]?.name).toBe('Pizza');
    expect(original?.items[0]?.children?.[0]?.name).toBe('Chicken Pepperoni');
  });

  it('returns undefined for an unknown preset id', () => {
    expect(getPreset('missing-preset')).toBeUndefined();
  });

  it('lists independent clones and keeps the frozen catalog identity', () => {
    const listed = listPresets();
    const frozen = getFrozenPresetCatalog();

    expect(listed).not.toBe(frozen);
    expect(listed[0]).not.toBe(frozen[0]);
    expect(getFrozenPresetCatalog()).toBe(frozen);
    expect(Object.isFrozen(frozen)).toBe(true);
  });
});
