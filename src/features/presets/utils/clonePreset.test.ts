import { PRESET_ID } from '@/features/presets/constants';
import { getFrozenPresetCatalog, getPreset } from '@/features/presets/data/catalog';
import {
  countPresetChildren,
  countPresetItems,
  toCreateWheelInputFromPreset,
} from '@/features/presets/utils/clonePreset';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';

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
    expect(countPresetChildren(food.items)).toBe(2);

    const input = toCreateWheelInputFromPreset(food);
    expect(input.name).toBe('Food');
    expect(input.items?.[0]?.name).toBe('Pizza');
    expect(input.items?.[0]?.children?.map((item) => item.name)).toEqual([
      'Chicken Pepperoni',
      'Beef Pepperoni',
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
});
