import type { WheelItem } from '@/types/wheel';
import {
  addChildToTree,
  canMoveItem,
  cloneItemTree,
  cloneItemsPreserveIds,
  collectDescendantIds,
  duplicateItemInTree,
  findItem,
  findItemLocation,
  mapItemTree,
  materializeItem,
  moveItemInTree,
  patchItem,
  removeItemFromTree,
  reorderSiblings,
} from '@/utils/wheelTree';

function item(name: string, extra?: Partial<WheelItem>): WheelItem {
  return {
    id: name.toLowerCase().replaceAll(' ', '-'),
    name,
    color: '#ef4444',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

describe('patchItem', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('preserves children and createdAt while updating updatedAt', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T10:00:00.000Z'));

    const child = item('Small');
    const original = item('Chicken Pepperoni', { children: [child] });

    vi.setSystemTime(new Date('2026-02-01T10:00:05.000Z'));
    const updated = patchItem(original, { name: 'Chicken Deluxe', weight: 3 });

    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Chicken Deluxe');
    expect(updated.weight).toBe(3);
    expect(updated.children).toBe(original.children);
    expect(updated.createdAt).toBe(original.createdAt);
    expect(updated.updatedAt).toBe('2026-02-01T10:00:05.000Z');
    expect(original.name).toBe('Chicken Pepperoni');
  });
});

describe('mapItemTree', () => {
  it('updates only the targeted nested child', () => {
    const large = item('Large', { weight: 2 });
    const small = item('Small');
    const chicken = item('Chicken Pepperoni', { children: [large, small] });
    const beef = item('Beef Pepperoni');
    const items = [chicken, beef];

    const next = mapItemTree(items, large.id, (current) =>
      patchItem(current, { name: 'Extra Large' }),
    );

    expect(next[1]).toBe(beef);
    expect(next[0]?.name).toBe('Chicken Pepperoni');
    expect(next[0]?.createdAt).toBe(chicken.createdAt);
    expect(next[0]?.updatedAt).toBe(chicken.updatedAt);
    expect(next[0]?.children?.[1]).toBe(small);
    expect(next[0]?.children?.[0]?.name).toBe('Extra Large');
    expect(next[0]?.children?.[0]?.children).toBe(large.children);
    expect(next[0]?.children?.[0]?.createdAt).toBe(large.createdAt);
    expect(next[0]?.children?.[0]?.updatedAt).not.toBe(large.updatedAt);
  });

  it('returns the original list when the item is missing', () => {
    const beef = item('Beef Pepperoni');
    const items = [item('Chicken Pepperoni', { children: [item('Small')] }), beef];

    expect(mapItemTree(items, 'missing', (current) => patchItem(current, { name: 'Nope' }))).toBe(items);
  });
});

describe('removeItemFromTree', () => {
  const extra = item('Extra cheese');
  const large = item('Large');
  const small = item('Small', { children: [extra] });
  const chicken = item('Chicken Pepperoni', { children: [small, large] });
  const beef = item('Beef Pepperoni');
  const items = [chicken, beef];

  it('removes a leaf and keeps its siblings', () => {
    const next = removeItemFromTree(items, large.id);

    expect(next[1]).toBe(beef);
    expect(next[0]?.children).toEqual([small]);
  });

  it('removes a parent and every descendant', () => {
    const next = removeItemFromTree(items, chicken.id);

    expect(next).toEqual([beef]);
    expect(next[0]).toBe(beef);
  });

  it('removes a deeply nested parent without changing siblings', () => {
    const next = removeItemFromTree(items, small.id);
    const nextChicken = next[0];

    expect(next[1]).toBe(beef);
    expect(nextChicken?.name).toBe('Chicken Pepperoni');
    expect(nextChicken?.children).toEqual([large]);
    expect(nextChicken?.children?.[0]).toBe(large);
  });

  it('returns the original list when the item is missing', () => {
    expect(removeItemFromTree(items, 'missing')).toBe(items);
  });
});

describe('moveItemInTree', () => {
  const extra = item('Extra cheese');
  const chicken = item('Chicken', { children: [extra] });
  const beef = item('Beef');
  const burger = item('Burger');
  const items = [item('Pizza', { children: [chicken, beef] }), burger];

  it('reorders siblings without changing parents', () => {
    const next = moveItemInTree(items, beef.id, 'pizza', 0);
    const pizza = next[0];

    expect(pizza?.children?.map((entry) => entry.id)).toEqual(['beef', 'chicken']);
    expect(pizza?.children?.[1]?.children).toEqual([extra]);
    expect(next[1]).toBe(burger);
  });

  it('reorders root items without flattening nested children', () => {
    const next = moveItemInTree(items, burger.id, null, 0);

    expect(next.map((entry) => entry.id)).toEqual(['burger', 'pizza']);
    expect(next[1]?.children?.map((entry) => entry.id)).toEqual(['chicken', 'beef']);
    expect(next[1]?.children?.[0]?.children).toEqual([extra]);
  });

  it('moves an item under another parent and preserves its descendants', () => {
    const next = moveItemInTree(items, chicken.id, burger.id, 0);

    expect(next[0]?.children?.map((entry) => entry.id)).toEqual(['beef']);
    expect(next[1]?.children?.map((entry) => entry.id)).toEqual(['chicken']);
    expect(next[1]?.children?.[0]?.children).toEqual([extra]);
  });

  it('rejects moving an item into itself', () => {
    expect(canMoveItem(items, 'pizza', 'pizza')).toBe(false);
    expect(moveItemInTree(items, 'pizza', 'pizza', 0)).toBe(items);
  });

  it('rejects moving an item into its own descendant', () => {
    expect(canMoveItem(items, 'pizza', 'chicken')).toBe(false);
    expect(canMoveItem(items, 'pizza', extra.id)).toBe(false);
    expect(moveItemInTree(items, 'pizza', extra.id, 0)).toBe(items);
    expect(moveItemInTree(items, 'chicken', extra.id, 0)).toBe(items);
  });

  it('allows moving a descendant out to another parent', () => {
    expect(canMoveItem(items, extra.id, burger.id)).toBe(true);

    const next = moveItemInTree(items, extra.id, burger.id, 0);
    expect(next[0]?.children?.[0]?.children).toEqual([]);
    expect(next[1]?.children?.map((entry) => entry.id)).toEqual(['extra-cheese']);
  });

  it('no-ops when the item is already at the requested index', () => {
    expect(moveItemInTree(items, burger.id, null, 1)).toBe(items);
    expect(moveItemInTree(items, chicken.id, 'pizza', 0)).toBe(items);
  });

  it('clamps out-of-range indexes when reordering siblings', () => {
    const next = moveItemInTree(items, chicken.id, 'pizza', 99);
    expect(next[0]?.children?.map((entry) => entry.id)).toEqual(['beef', 'chicken']);

    const toStart = moveItemInTree(items, beef.id, 'pizza', -4);
    expect(toStart[0]?.children?.map((entry) => entry.id)).toEqual(['beef', 'chicken']);
  });

  it('rejects a missing item or missing target parent', () => {
    expect(canMoveItem(items, 'missing', null)).toBe(false);
    expect(canMoveItem(items, extra.id, 'missing')).toBe(false);
    expect(moveItemInTree(items, 'missing', null, 0)).toBe(items);
    expect(moveItemInTree(items, extra.id, 'missing', 0)).toBe(items);
  });

  it('returns the original list when a found item later has no location', () => {
    const extra = item('Extra cheese');
    const chicken = item('Chicken');
    let childReads = 0;
    Object.defineProperty(chicken, 'children', {
      configurable: true,
      enumerable: true,
      get() {
        childReads += 1;
        return childReads <= 2 ? [extra] : [];
      },
    });
    const shifting = [item('Pizza', { children: [chicken] }), item('Burger')];

    expect(moveItemInTree(shifting, extra.id, 'burger', 0)).toBe(shifting);
  });

  it('clamps an empty sibling list and ignores a stale source index', () => {
    const extra = item('Extra cheese');
    const sibling = item('Small');
    const long = [sibling, extra];
    const short = [sibling];
    const chicken = item('Chicken');
    const shifting = [item('Pizza', { children: [chicken] })];

    for (const fallback of [[], short]) {
      for (let limit = 1; limit <= 20; limit += 1) {
        let childReads = 0;
        Object.defineProperty(chicken, 'children', {
          configurable: true,
          enumerable: true,
          get() {
            childReads += 1;
            return childReads <= limit ? long : fallback;
          },
        });
        moveItemInTree(shifting, extra.id, 'chicken', 0);
        moveItemInTree(shifting, extra.id, 'chicken', 1);
      }
    }

    expect(findItem(shifting, extra.id)?.name).toBe('Extra cheese');
  });
});

describe('materializeItem', () => {
  it('keeps a provided id and materializes nested children', () => {
    const taco = materializeItem({
      id: 'taco',
      name: 'Taco',
      description: 'Street food',
      icon: '🌮',
      color: '#22c55e',
      enabled: true,
      weight: 2,
      children: [{ name: 'Small', color: '#4ade80', enabled: true, weight: 1 }],
    });

    expect(taco.id).toBe('taco');
    expect(taco.name).toBe('Taco');
    expect(taco.children).toHaveLength(1);
    expect(taco.children?.[0]?.name).toBe('Small');
    expect(taco.children?.[0]?.id).toEqual(expect.any(String));
  });

  it('assigns an id and omits children when none are provided', () => {
    const sushi = materializeItem({
      name: 'Sushi',
      color: '#0f766e',
      enabled: true,
      weight: 1,
    });

    expect(sushi.id).toEqual(expect.any(String));
    expect(sushi.children).toBeUndefined();
  });
});

describe('cloneItemsPreserveIds', () => {
  it('clones nested items while keeping ids and undefined children', () => {
    const leaf = item('Sushi');
    const pizza = item('Pizza', { children: [item('Chicken')] });
    const [clonedPizza, clonedSushi] = cloneItemsPreserveIds([pizza, leaf]);

    expect(clonedPizza?.id).toBe(pizza.id);
    expect(clonedPizza?.children?.[0]?.id).toBe(pizza.children?.[0]?.id);
    expect(clonedPizza).not.toBe(pizza);
    expect(clonedPizza?.children).not.toBe(pizza.children);
    expect(clonedSushi?.children).toBeUndefined();
  });
});

describe('cloneItemTree', () => {
  it('assigns new ids to an item and its children', () => {
    const chicken = item('Chicken', { children: [item('Small')] });
    const copy = cloneItemTree(chicken);

    expect(copy.id).not.toBe(chicken.id);
    expect(copy.name).toBe('Chicken');
    expect(copy.children?.[0]?.id).not.toBe(chicken.children?.[0]?.id);
    expect(copy.children?.[0]?.name).toBe('Small');
    expect(cloneItemTree(item('Sushi')).children).toBeUndefined();
  });
});

describe('findItem', () => {
  it('finds nested items and returns undefined when missing', () => {
    const extra = item('Extra cheese');
    const chicken = item('Chicken', { children: [extra] });
    const sushi = item('Sushi', { children: [] });
    const items = [item('Pizza', { children: [chicken] }), sushi];

    expect(findItem(items, extra.id)).toBe(extra);
    expect(findItem(items, 'missing')).toBeUndefined();
    expect(findItem([], 'pizza')).toBeUndefined();
  });
});

describe('addChildToTree', () => {
  it('adds a child to a nested parent and to a leaf without children', () => {
    const child = item('Hawaiian');
    const small = item('Small');
    const chicken = item('Chicken', { children: [small] });
    const sushi = item('Sushi');
    const items = [item('Pizza', { children: [chicken] }), sushi];

    const underChicken = addChildToTree(items, chicken.id, child);
    expect(underChicken[0]?.children?.[0]?.children?.map((entry) => entry.id)).toEqual(['small', 'hawaiian']);

    const underSushi = addChildToTree(items, sushi.id, child);
    expect(underSushi[1]?.children).toEqual([child]);
  });

  it('returns the original list when the parent is missing', () => {
    const items = [item('Pizza', { children: [item('Chicken')] }), item('Sushi')];
    expect(addChildToTree(items, 'missing', item('Taco'))).toBe(items);
  });
});

describe('duplicateItemInTree', () => {
  it('duplicates a root item and a nested item', () => {
    const extra = item('Extra cheese');
    const chicken = item('Chicken', { children: [extra] });
    const items = [item('Pizza', { children: [chicken] }), item('Sushi')];

    const rootCopy = duplicateItemInTree(items, 'sushi');
    expect(rootCopy.copy?.name).toBe('Sushi copy');
    expect(rootCopy.copy?.id).not.toBe('sushi');
    expect(rootCopy.items.map((entry) => entry.name)).toEqual(['Pizza', 'Sushi', 'Sushi copy']);

    const nestedCopy = duplicateItemInTree(items, extra.id);
    expect(nestedCopy.copy?.name).toBe('Extra cheese copy');
    expect(nestedCopy.items[0]?.children?.[0]?.children?.map((entry) => entry.name)).toEqual([
      'Extra cheese',
      'Extra cheese copy',
    ]);
  });

  it('returns no copy when the item is missing', () => {
    const items = [item('Pizza', { children: [item('Chicken')] }), item('Sushi')];
    expect(duplicateItemInTree(items, 'missing')).toEqual({ items, copy: undefined });
  });

  it('returns the original list when a found index has no item', () => {
    const pizza = item('Pizza');
    const items: WheelItem[] = [];
    let reads = 0;
    Object.defineProperty(items, '0', {
      enumerable: true,
      configurable: true,
      get() {
        reads += 1;
        return reads === 1 ? pizza : undefined;
      },
    });
    items.length = 1;

    expect(duplicateItemInTree(items, pizza.id)).toEqual({ items });
  });
});

describe('reorderSiblings', () => {
  it('reorders root items and keeps unknown ids in place', () => {
    const pizza = item('Pizza');
    const burger = item('Burger');
    const sushi = item('Sushi');
    const items = [pizza, burger, sushi];

    expect(reorderSiblings(items, null, ['sushi', 'missing', 'pizza']).map((entry) => entry.id)).toEqual([
      'sushi',
      'pizza',
      'burger',
    ]);
  });

  it('reorders nested siblings', () => {
    const chicken = item('Chicken');
    const beef = item('Beef');
    const items = [item('Pizza', { children: [chicken, beef] })];

    expect(reorderSiblings(items, 'pizza', ['beef', 'chicken'])[0]?.children?.map((entry) => entry.id)).toEqual([
      'beef',
      'chicken',
    ]);
    expect(reorderSiblings(items, 'missing', ['beef'])).toBe(items);
    expect(reorderSiblings([item('Sushi')], 'sushi', [])[0]?.children).toEqual([]);
  });
});

describe('findItemLocation and descendants', () => {
  it('locates items and collects descendant ids', () => {
    const extra = item('Extra cheese');
    const chicken = item('Chicken', { children: [extra] });
    const sushi = item('Sushi', { children: [] });
    const pizza = item('Pizza', { children: [chicken] });
    const items = [pizza, sushi];

    expect(findItemLocation(items, pizza.id)).toEqual({ parentId: null, index: 0 });
    expect(findItemLocation(items, extra.id)).toEqual({ parentId: 'chicken', index: 0 });
    expect(findItemLocation(items, 'missing')).toBeUndefined();
    expect(collectDescendantIds(pizza)).toEqual(['chicken', 'extra-cheese']);
    expect(collectDescendantIds(sushi)).toEqual([]);
  });
});
