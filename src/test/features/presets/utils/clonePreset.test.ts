import { ITEM_COLORS } from '@/constants/wheel';
import { PRESET_ID } from '@/features/presets/constants';
import { getFrozenPresetCatalog, getPreset } from '@/features/presets/data/catalog';
import type { WheelPresetDefinition } from '@/features/presets/types';
import {
  cloneItemDefinitions,
  clonePresetDefinition,
  countPresetChildren,
  countPresetItems,
  countPresetRoots,
  toCreateWheelInputFromPreset,
} from '@/features/presets/utils/clonePreset';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';

const customPreset: WheelPresetDefinition = {
  id: 'custom',
  name: 'Custom',
  description: 'Local fixture',
  category: 'General',
  icon: '🎯',
  items: [
    { name: 'Plain' },
    {
      name: 'Styled',
      description: 'Has extras',
      icon: '⭐',
      color: '#dc2626',
      weight: 3,
      children: [{ name: 'Child', color: '#16a34a', weight: 2 }],
    },
  ],
};

describe('clonePreset', () => {
  beforeEach(() => {
    resetWheelStore();
  });

  it('counts nested food items and maps a preset to a new wheel draft', () => {
    const food = getPreset(PRESET_ID.food);
    expect(food).toBeDefined();
    if (!food) {
      return;
    }

    expect(countPresetItems(food.items)).toBe(6);
    expect(countPresetRoots(food.items)).toBe(4);
    expect(countPresetChildren(food.items)).toBe(2);

    const input = toCreateWheelInputFromPreset(food);
    expect(input.name).toBe('Food');
    expect(input.items?.[0]?.name).toBe('Pizza');
    expect(input.items?.[0]?.color).toBe(ITEM_COLORS[0]);
    expect(input.items?.[0]?.weight).toBe(1);
    expect(input.items?.[0]?.children?.map((item) => item.name)).toEqual([
      'Chicken Pepperoni',
      'Beef Pepperoni',
    ]);
  });

  it('counts an empty list as zero roots and children', () => {
    expect(countPresetItems([])).toBe(0);
    expect(countPresetRoots([])).toBe(0);
    expect(countPresetChildren([])).toBe(0);
  });

  it('clones preset items without sharing nested arrays', () => {
    const clone = clonePresetDefinition(customPreset);
    const items = cloneItemDefinitions(customPreset.items);

    clone.name = 'Changed';
    clone.items[0]!.name = 'Renamed';
    items[1]!.children![0]!.name = 'Edited child';

    expect(customPreset.name).toBe('Custom');
    expect(customPreset.items[0]?.name).toBe('Plain');
    expect(customPreset.items[1]?.children?.[0]?.name).toBe('Child');
    expect(items[0]?.children).toBeUndefined();
    expect(clone.items[1]?.children?.[0]?.name).toBe('Child');
  });

  it('keeps explicit colors and weights and defaults the rest', () => {
    const input = toCreateWheelInputFromPreset(customPreset);

    expect(input).toMatchObject({
      name: 'Custom',
      description: 'Local fixture',
      category: 'General',
      icon: '🎯',
    });
    expect(input.items).toEqual([
      {
        name: 'Plain',
        description: undefined,
        icon: undefined,
        color: ITEM_COLORS[0],
        enabled: true,
        weight: 1,
        children: undefined,
      },
      {
        name: 'Styled',
        description: 'Has extras',
        icon: '⭐',
        color: '#dc2626',
        enabled: true,
        weight: 3,
        children: [
          {
            name: 'Child',
            description: undefined,
            icon: undefined,
            color: '#16a34a',
            enabled: true,
            weight: 2,
            children: undefined,
          },
        ],
      },
    ]);
  });

  it('creates a user wheel copy without changing the catalog', () => {
    const food = getPreset(PRESET_ID.food);
    expect(food).toBeDefined();
    if (!food) {
      return;
    }

    const wheel = useWheelStore.getState().createWheel(toCreateWheelInputFromPreset(food));
    const pizza = wheel.items.find((item) => item.name === 'Pizza');
    expect(pizza?.children?.map((item) => item.name)).toEqual(['Chicken Pepperoni', 'Beef Pepperoni']);
    expect(pizza?.id).not.toBe('Pizza');

    useWheelStore.getState().updateItem(wheel.id, pizza?.id ?? '', { name: 'Deep Dish' });

    const original = getFrozenPresetCatalog().find((preset) => preset.id === PRESET_ID.food);
    expect(original?.items[0]?.name).toBe('Pizza');
    expect(useWheelStore.getState().getWheel(wheel.id)?.items[0]?.name).toBe('Deep Dish');
  });

  it('falls back to indigo when a palette slot is missing', async () => {
    vi.resetModules();
    vi.doMock('@/constants/wheel', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/constants/wheel')>();
      return { ...actual, ITEM_COLORS: [] };
    });

    const { toCreateWheelInputFromPreset: mapWithEmptyPalette } = await import(
      '@/features/presets/utils/clonePreset'
    );

    expect(
      mapWithEmptyPalette({
        id: 'custom',
        name: 'Custom',
        description: 'Local fixture',
        category: 'General',
        icon: '🎯',
        items: [{ name: 'Plain' }],
      }).items?.[0]?.color,
    ).toBe('#4f46e5');
  });
});
