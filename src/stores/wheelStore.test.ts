import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import type { WheelItem, WheelItemDraft } from '@/types/wheel';

import { resetWheelStore, useWheelStore } from './wheelStore';

function draft(name: string, extra?: Partial<WheelItemDraft>): WheelItemDraft {
  return {
    name,
    color: '#ef4444',
    enabled: true,
    weight: 1,
    ...extra,
  };
}

function pizzaWheel() {
  return useWheelStore.getState().createWheel({
    id: 'pizza',
    name: 'Pizza',
    items: [
      draft('Chicken Pepperoni', { color: '#f97316' }),
      draft('Beef Pepperoni', { color: '#dc2626' }),
    ],
  });
}

describe('useWheelStore', () => {
  beforeEach(() => {
    resetWheelStore();
  });

  it('createWheel creates a wheel with default settings', () => {
    const wheel = useWheelStore.getState().createWheel({ name: 'Pizza' });

    expect(wheel.name).toBe('Pizza');
    expect(wheel.items).toEqual([]);
    expect(wheel.settings).toEqual(DEFAULT_WHEEL_SETTINGS);
    expect(useWheelStore.getState().wheels).toHaveLength(1);
  });

  it('updateWheel updates wheel metadata immutably', () => {
    const created = useWheelStore.getState().createWheel({ name: 'Pizza' });
    const updated = useWheelStore.getState().updateWheel(created.id, {
      name: 'Dinner Pizza',
      description: 'Weekend menu',
    });

    expect(updated?.name).toBe('Dinner Pizza');
    expect(updated?.description).toBe('Weekend menu');
    expect(created.name).toBe('Pizza');
    expect(useWheelStore.getState().getWheel(created.id)?.name).toBe('Dinner Pizza');
  });

  it('deleteWheel removes a wheel and clears the active wheel', () => {
    const wheel = useWheelStore.getState().createWheel({ name: 'Pizza' });
    useWheelStore.getState().setActiveWheel(wheel.id);
    useWheelStore.getState().deleteWheel(wheel.id);

    expect(useWheelStore.getState().getWheel(wheel.id)).toBeUndefined();
    expect(useWheelStore.getState().activeWheelId).toBeNull();
  });

  it('duplicateWheel copies items with new ids', () => {
    const source = pizzaWheel();
    const copy = useWheelStore.getState().duplicateWheel(source.id);

    expect(copy?.name).toBe('Pizza copy');
    expect(copy?.id).not.toBe(source.id);
    expect(copy?.items).toHaveLength(2);
    expect(copy?.items[0]?.id).not.toBe(source.items[0]?.id);
    expect(copy?.items[0]?.name).toBe('Chicken Pepperoni');
    expect(useWheelStore.getState().wheels).toHaveLength(2);
  });

  it('getWheel returns a wheel by id', () => {
    pizzaWheel();

    expect(useWheelStore.getState().getWheel('pizza')?.name).toBe('Pizza');
    expect(useWheelStore.getState().getWheel('missing')).toBeUndefined();
  });

  it('setActiveWheel selects an existing wheel only', () => {
    pizzaWheel();
    useWheelStore.getState().setActiveWheel('pizza');
    useWheelStore.getState().setActiveWheel('missing');

    expect(useWheelStore.getState().activeWheelId).toBe('pizza');
    useWheelStore.getState().setActiveWheel(null);
    expect(useWheelStore.getState().activeWheelId).toBeNull();
  });

  it('addItem appends a root item', () => {
    pizzaWheel();
    const item = useWheelStore.getState().addItem('pizza', draft('Veggie'));

    expect(item?.name).toBe('Veggie');
    expect(useWheelStore.getState().getWheel('pizza')?.items).toHaveLength(3);
  });

  it('updateItem updates a nested item without mutating the original', () => {
    const wheel = pizzaWheel();
    const chicken = wheel.items[0];
    expect(chicken).toBeDefined();
    if (!chicken) {
      throw new Error('Expected chicken item');
    }

    const updated = useWheelStore.getState().updateItem('pizza', chicken.id, {
      name: 'Chicken Deluxe',
      weight: 3,
    });

    expect(updated?.name).toBe('Chicken Deluxe');
    expect(updated?.weight).toBe(3);
    expect(chicken.name).toBe('Chicken Pepperoni');
    expect(useWheelStore.getState().getWheel('pizza')?.items[0]?.name).toBe('Chicken Deluxe');
  });

  it('deleteItem removes a root item', () => {
    const wheel = pizzaWheel();
    const chicken = wheel.items[0];
    expect(chicken).toBeDefined();
    if (!chicken) {
      throw new Error('Expected chicken item');
    }

    useWheelStore.getState().deleteItem('pizza', chicken.id);

    const items = useWheelStore.getState().getWheel('pizza')?.items ?? [];
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe('Beef Pepperoni');
  });

  it('duplicateItem inserts a copy beside the original', () => {
    const wheel = pizzaWheel();
    const chicken = wheel.items[0];
    expect(chicken).toBeDefined();
    if (!chicken) {
      throw new Error('Expected chicken item');
    }

    const copy = useWheelStore.getState().duplicateItem('pizza', chicken.id);
    const items = useWheelStore.getState().getWheel('pizza')?.items ?? [];

    expect(copy?.name).toBe('Chicken Pepperoni copy');
    expect(copy?.id).not.toBe(chicken.id);
    expect(items.map((item) => item.name)).toEqual([
      'Chicken Pepperoni',
      'Chicken Pepperoni copy',
      'Beef Pepperoni',
    ]);
  });

  it('addChildItem("pizza", child) adds a child under the Pizza wheel', () => {
    useWheelStore.getState().createWheel({ id: 'pizza', name: 'Pizza' });

    const child = useWheelStore.getState().addChildItem('pizza', draft('Chicken Pepperoni'));
    const wheel = useWheelStore.getState().getWheel('pizza');

    expect(child?.name).toBe('Chicken Pepperoni');
    expect(wheel?.items).toHaveLength(1);
    expect(wheel?.items[0]?.name).toBe('Chicken Pepperoni');
  });

  it('addChildItem adds a nested child under a parent item', () => {
    const wheel = pizzaWheel();
    const chicken = wheel.items[0];
    expect(chicken).toBeDefined();
    if (!chicken) {
      throw new Error('Expected chicken item');
    }

    const originalChicken: WheelItem = chicken;
    const small = useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
    const nextChicken = useWheelStore.getState().getWheel('pizza')?.items[0];

    expect(small?.name).toBe('Small');
    expect(originalChicken.children).toBeUndefined();
    expect(nextChicken?.children).toHaveLength(1);
    expect(nextChicken?.children?.[0]?.name).toBe('Small');
  });

  it('updateChildItem updates a nested child by id', () => {
    const wheel = pizzaWheel();
    const chicken = wheel.items[0];
    expect(chicken).toBeDefined();
    if (!chicken) {
      throw new Error('Expected chicken item');
    }

    const small = useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
    expect(small).toBeDefined();
    if (!small) {
      throw new Error('Expected small item');
    }

    const updated = useWheelStore.getState().updateChildItem(small.id, { name: 'Personal' });

    expect(updated?.name).toBe('Personal');
    expect(useWheelStore.getState().getWheel('pizza')?.items[0]?.children?.[0]?.name).toBe(
      'Personal',
    );
  });

  it('deleteChildItem removes a nested child and keeps siblings', () => {
    const wheel = pizzaWheel();
    const chicken = wheel.items[0];
    expect(chicken).toBeDefined();
    if (!chicken) {
      throw new Error('Expected chicken item');
    }

    const small = useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
    useWheelStore.getState().addChildItem(chicken.id, draft('Large'));
    expect(small).toBeDefined();
    if (!small) {
      throw new Error('Expected small item');
    }

    useWheelStore.getState().deleteChildItem(small.id);

    expect(useWheelStore.getState().getWheel('pizza')?.items[0]?.children).toHaveLength(1);
    expect(useWheelStore.getState().getWheel('pizza')?.items[0]?.children?.[0]?.name).toBe('Large');
  });

  it('reorderItems reorders root and nested siblings', () => {
    const wheel = pizzaWheel();
    const chicken = wheel.items[0];
    const beef = wheel.items[1];
    expect(chicken).toBeDefined();
    expect(beef).toBeDefined();
    if (!chicken || !beef) {
      throw new Error('Expected topping items');
    }

    useWheelStore.getState().reorderItems('pizza', null, [beef.id, chicken.id]);
    expect(
      useWheelStore
        .getState()
        .getWheel('pizza')
        ?.items.map((item) => item.name),
    ).toEqual(['Beef Pepperoni', 'Chicken Pepperoni']);

    const small = useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
    const large = useWheelStore.getState().addChildItem(chicken.id, draft('Large'));
    expect(small).toBeDefined();
    expect(large).toBeDefined();
    if (!small || !large) {
      throw new Error('Expected size items');
    }

    useWheelStore.getState().reorderItems('pizza', chicken.id, [large.id, small.id]);
    expect(
      useWheelStore
        .getState()
        .getWheel('pizza')
        ?.items[1]?.children?.map((item) => item.name),
    ).toEqual(['Large', 'Small']);
  });

  it('toggleItem flips enabled on a nested item', () => {
    const wheel = pizzaWheel();
    const chicken = wheel.items[0];
    expect(chicken).toBeDefined();
    if (!chicken) {
      throw new Error('Expected chicken item');
    }

    const small = useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
    expect(small).toBeDefined();
    if (!small) {
      throw new Error('Expected small item');
    }

    const toggled = useWheelStore.getState().toggleItem('pizza', small.id);

    expect(small.enabled).toBe(true);
    expect(toggled?.enabled).toBe(false);
    expect(useWheelStore.getState().getWheel('pizza')?.items[0]?.children?.[0]?.enabled).toBe(
      false,
    );
  });

  it('updateWheelSettings merges settings immutably', () => {
    const wheel = pizzaWheel();
    const settings = useWheelStore.getState().updateWheelSettings('pizza', {
      soundEnabled: false,
      durationMs: 2500,
    });

    expect(settings?.soundEnabled).toBe(false);
    expect(settings?.durationMs).toBe(2500);
    expect(settings?.autoSpinChildren).toBe(true);
    expect(wheel.settings.soundEnabled).toBe(true);
  });

  it('resetWheel restores the original items and settings', () => {
    pizzaWheel();
    useWheelStore.getState().addChildItem('pizza', draft('Veggie'));
    useWheelStore.getState().updateWheelSettings('pizza', { soundEnabled: false });

    const reset = useWheelStore.getState().resetWheel('pizza');

    expect(reset?.items).toHaveLength(2);
    expect(reset?.items.map((item) => item.name)).toEqual(['Chicken Pepperoni', 'Beef Pepperoni']);
    expect(reset?.settings.soundEnabled).toBe(true);
  });

  it('returns undefined when a parent cannot be found', () => {
    expect(useWheelStore.getState().addChildItem('missing', draft('Small'))).toBeUndefined();
    expect(useWheelStore.getState().updateWheel('missing', { name: 'Nope' })).toBeUndefined();
    expect(useWheelStore.getState().duplicateWheel('missing')).toBeUndefined();
  });
});
