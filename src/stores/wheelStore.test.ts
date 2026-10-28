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

  describe('item editing', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('updates a root item while preserving children and createdAt', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-01T08:00:00.000Z'));
      pizzaWheel();
      const chicken = useWheelStore.getState().getWheel('pizza')?.items[0];
      expect(chicken).toBeDefined();
      if (!chicken) {
        throw new Error('Expected chicken item');
      }

      useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
      const before = useWheelStore.getState().getWheel('pizza')?.items[0];
      expect(before).toBeDefined();
      if (!before) {
        throw new Error('Expected chicken with children');
      }

      vi.setSystemTime(new Date('2026-03-01T08:00:08.000Z'));
      const updated = useWheelStore.getState().updateItem('pizza', before.id, {
        name: 'Chicken Deluxe',
        description: 'Spicy topping',
      });
      const next = useWheelStore.getState().getWheel('pizza')?.items[0];
      const beef = useWheelStore.getState().getWheel('pizza')?.items[1];

      expect(updated?.name).toBe('Chicken Deluxe');
      expect(updated?.description).toBe('Spicy topping');
      expect(updated?.createdAt).toBe(before.createdAt);
      expect(updated?.updatedAt).toBe('2026-03-01T08:00:08.000Z');
      expect(updated?.children).toEqual(before.children);
      expect(next?.children?.[0]?.name).toBe('Small');
      expect(beef?.name).toBe('Beef Pepperoni');
    });

    it('updates a child without changing its siblings', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-01T09:00:00.000Z'));
      pizzaWheel();
      const chicken = useWheelStore.getState().getWheel('pizza')?.items[0];
      expect(chicken).toBeDefined();
      if (!chicken) {
        throw new Error('Expected chicken item');
      }

      const small = useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
      const large = useWheelStore.getState().addChildItem(chicken.id, draft('Large'));
      expect(small).toBeDefined();
      expect(large).toBeDefined();
      if (!small || !large) {
        throw new Error('Expected size items');
      }

      const parentBefore = useWheelStore.getState().getWheel('pizza')?.items[0];
      vi.setSystemTime(new Date('2026-03-01T09:00:04.000Z'));
      const updated = useWheelStore.getState().updateChildItem(small.id, { name: 'Personal' });
      const parentAfter = useWheelStore.getState().getWheel('pizza')?.items[0];

      expect(updated?.name).toBe('Personal');
      expect(updated?.createdAt).toBe(small.createdAt);
      expect(updated?.updatedAt).toBe('2026-03-01T09:00:04.000Z');
      expect(parentAfter?.name).toBe('Chicken Pepperoni');
      expect(parentAfter?.updatedAt).toBe(parentBefore?.updatedAt);
      expect(parentAfter?.children?.[1]).toEqual(large);
    });

    it('updates a deeply nested item without changing ancestors or siblings', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-01T10:00:00.000Z'));
      pizzaWheel();
      const chicken = useWheelStore.getState().getWheel('pizza')?.items[0];
      const beef = useWheelStore.getState().getWheel('pizza')?.items[1];
      expect(chicken).toBeDefined();
      expect(beef).toBeDefined();
      if (!chicken || !beef) {
        throw new Error('Expected topping items');
      }

      const small = useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
      expect(small).toBeDefined();
      if (!small) {
        throw new Error('Expected small item');
      }

      const extra = useWheelStore.getState().addChildItem(small.id, draft('Extra spicy'));
      const mild = useWheelStore.getState().addChildItem(small.id, draft('Mild'));
      expect(extra).toBeDefined();
      expect(mild).toBeDefined();
      if (!extra || !mild) {
        throw new Error('Expected nested items');
      }

      const before = useWheelStore.getState().getWheel('pizza');
      vi.setSystemTime(new Date('2026-03-01T10:00:09.000Z'));
      const updated = useWheelStore.getState().updateChildItem(extra.id, {
        name: 'Extra cheese',
        weight: 4,
      });
      const after = useWheelStore.getState().getWheel('pizza');
      const nextChicken = after?.items[0];
      const nextSmall = nextChicken?.children?.[0];

      expect(updated?.name).toBe('Extra cheese');
      expect(updated?.weight).toBe(4);
      expect(updated?.createdAt).toBe(extra.createdAt);
      expect(updated?.updatedAt).toBe('2026-03-01T10:00:09.000Z');
      expect(updated?.children).toBe(extra.children);
      expect(after?.items[1]).toBe(beef);
      expect(nextChicken?.name).toBe('Chicken Pepperoni');
      expect(nextChicken?.createdAt).toBe(before?.items[0]?.createdAt);
      expect(nextChicken?.updatedAt).toBe(before?.items[0]?.updatedAt);
      expect(nextSmall?.name).toBe('Small');
      expect(nextSmall?.updatedAt).toBe(before?.items[0]?.children?.[0]?.updatedAt);
      expect(nextSmall?.children?.[1]).toEqual(mild);
      expect(nextSmall?.children?.[0]?.name).toBe('Extra cheese');
    });
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

  describe('item deletion', () => {
    it('deletes a leaf without changing siblings', () => {
      pizzaWheel();
      const chicken = useWheelStore.getState().getWheel('pizza')?.items[0];
      expect(chicken).toBeDefined();
      if (!chicken) {
        throw new Error('Expected chicken item');
      }

      const small = useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
      const large = useWheelStore.getState().addChildItem(chicken.id, draft('Large'));
      expect(small).toBeDefined();
      expect(large).toBeDefined();
      if (!small || !large) {
        throw new Error('Expected size items');
      }

      useWheelStore.getState().deleteChildItem(small.id);
      const nextChicken = useWheelStore.getState().getWheel('pizza')?.items[0];
      const beef = useWheelStore.getState().getWheel('pizza')?.items[1];

      expect(nextChicken?.children).toHaveLength(1);
      expect(nextChicken?.children?.[0]?.id).toBe(large.id);
      expect(beef?.name).toBe('Beef Pepperoni');
    });

    it('deletes a parent and every descendant', () => {
      pizzaWheel();
      const chicken = useWheelStore.getState().getWheel('pizza')?.items[0];
      const beef = useWheelStore.getState().getWheel('pizza')?.items[1];
      expect(chicken).toBeDefined();
      expect(beef).toBeDefined();
      if (!chicken || !beef) {
        throw new Error('Expected topping items');
      }

      useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
      useWheelStore.getState().addChildItem(chicken.id, draft('Large'));
      useWheelStore.getState().deleteItem('pizza', chicken.id);

      const items = useWheelStore.getState().getWheel('pizza')?.items ?? [];
      expect(items).toEqual([beef]);
      expect(items.map((entry) => entry.name)).toEqual(['Beef Pepperoni']);
    });

    it('deletes a deeply nested parent without changing siblings', () => {
      pizzaWheel();
      const chicken = useWheelStore.getState().getWheel('pizza')?.items[0];
      const beef = useWheelStore.getState().getWheel('pizza')?.items[1];
      expect(chicken).toBeDefined();
      expect(beef).toBeDefined();
      if (!chicken || !beef) {
        throw new Error('Expected topping items');
      }

      const small = useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
      const large = useWheelStore.getState().addChildItem(chicken.id, draft('Large'));
      expect(small).toBeDefined();
      expect(large).toBeDefined();
      if (!small || !large) {
        throw new Error('Expected size items');
      }

      useWheelStore.getState().addChildItem(small.id, draft('Extra cheese'));
      useWheelStore.getState().deleteChildItem(small.id);

      const nextChicken = useWheelStore.getState().getWheel('pizza')?.items[0];
      expect(useWheelStore.getState().getWheel('pizza')?.items[1]).toBe(beef);
      expect(nextChicken?.name).toBe('Chicken Pepperoni');
      expect(nextChicken?.children).toHaveLength(1);
      expect(nextChicken?.children?.[0]?.id).toBe(large.id);
      expect(nextChicken?.children?.[0]?.name).toBe('Large');
    });
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

  describe('moveItem hierarchy safety', () => {
    it('reorders root items immutably', () => {
      const wheel = pizzaWheel();
      const chicken = wheel.items[0];
      const beef = wheel.items[1];
      expect(chicken).toBeDefined();
      expect(beef).toBeDefined();
      if (!chicken || !beef) {
        throw new Error('Expected topping items');
      }

      const moved = useWheelStore.getState().moveItem('pizza', beef.id, null, 0);
      const next = useWheelStore.getState().getWheel('pizza')?.items ?? [];

      expect(moved?.id).toBe(beef.id);
      expect(next.map((item) => item.name)).toEqual(['Beef Pepperoni', 'Chicken Pepperoni']);
      expect(wheel.items[0]?.name).toBe('Chicken Pepperoni');
    });

    it('moves an item under another parent and keeps descendants', () => {
      pizzaWheel();
      const chicken = useWheelStore.getState().getWheel('pizza')?.items[0];
      const beef = useWheelStore.getState().getWheel('pizza')?.items[1];
      expect(chicken).toBeDefined();
      expect(beef).toBeDefined();
      if (!chicken || !beef) {
        throw new Error('Expected topping items');
      }

      const small = useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
      expect(small).toBeDefined();
      if (!small) {
        throw new Error('Expected small item');
      }

      useWheelStore.getState().moveItem('pizza', chicken.id, beef.id, 0);
      const next = useWheelStore.getState().getWheel('pizza')?.items ?? [];

      expect(next.map((item) => item.name)).toEqual(['Beef Pepperoni']);
      expect(next[0]?.children?.map((item) => item.name)).toEqual(['Chicken Pepperoni']);
      expect(next[0]?.children?.[0]?.children?.map((item) => item.name)).toEqual(['Small']);
    });

    it('does not let an item become its own descendant', () => {
      pizzaWheel();
      const chicken = useWheelStore.getState().getWheel('pizza')?.items[0];
      const beef = useWheelStore.getState().getWheel('pizza')?.items[1];
      expect(chicken).toBeDefined();
      expect(beef).toBeDefined();
      if (!chicken || !beef) {
        throw new Error('Expected topping items');
      }

      const small = useWheelStore.getState().addChildItem(chicken.id, draft('Small'));
      expect(small).toBeDefined();
      if (!small) {
        throw new Error('Expected small item');
      }

      const before = useWheelStore.getState().getWheel('pizza')?.items;
      expect(useWheelStore.getState().moveItem('pizza', chicken.id, small.id, 0)).toBeUndefined();
      expect(useWheelStore.getState().moveItem('pizza', chicken.id, chicken.id, 0)).toBeUndefined();
      expect(useWheelStore.getState().getWheel('pizza')?.items).toBe(before);
    });
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
    expect(settings?.selectionMode).toBe('manual');
    expect(settings?.removeWinner).toBe(false);
    expect(settings?.appearance.theme).toBe('classic');
    expect(wheel.settings.soundEnabled).toBe(true);
  });

  it('updateWheelSettings merges appearance without replacing other settings', () => {
    pizzaWheel();
    const settings = useWheelStore.getState().updateWheelSettings('pizza', {
      appearance: { pointerColor: '#111111', title: 'Dinner' },
    });

    expect(settings?.appearance.pointerColor).toBe('#111111');
    expect(settings?.appearance.title).toBe('Dinner');
    expect(settings?.appearance.theme).toBe('custom');
    expect(settings?.appearance.background).toBe(DEFAULT_WHEEL_SETTINGS.appearance.background);
    expect(settings?.durationMs).toBe(4000);
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
