import type { WheelItem } from '@/types/wheel';
import {
  canMoveItem,
  mapItemTree,
  moveItemInTree,
  patchItem,
  removeItemFromTree,
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
});
