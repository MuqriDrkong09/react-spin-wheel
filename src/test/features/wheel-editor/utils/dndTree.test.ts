import { TREE_NODE_KIND, type EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import {
  blockedParentIds,
  canDropUnder,
  collectVisibleItemIds,
  parseDroppableId,
  preferItemCollisions,
  resolveTreeMove,
  toDroppableId,
  treeCollisionDetection,
} from '@/features/wheel-editor/utils/dndTree';

const collisionHarness = vi.hoisted(() => ({
  pointer: [] as Array<{ id: string }>,
  closest: [] as Array<{ id: string }>,
}));

vi.mock('@/utils/dnd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/dnd')>();

  return {
    ...actual,
    pointerWithin: () => collisionHarness.pointer,
    closestCenter: () => collisionHarness.closest,
  };
});

function node(
  id: string,
  extra?: Partial<EditorTreeNode> & { children?: EditorTreeNode[] },
): EditorTreeNode {
  return {
    id,
    name: id,
    enabled: true,
    weight: 1,
    kind: TREE_NODE_KIND.item,
    children: [],
    ...extra,
  };
}

const extra = node('extra', { name: 'Extra cheese' });
const chicken = node('chicken', { name: 'Chicken', children: [extra] });
const beef = node('beef', { name: 'Beef' });
const pizza = node('pizza', { name: 'Pizza', children: [chicken, beef] });
const burger = node('burger', { name: 'Burger' });
const root: EditorTreeNode = {
  id: 'food',
  name: 'Food',
  enabled: true,
  weight: 1,
  kind: TREE_NODE_KIND.wheel,
  children: [pizza, burger],
};

const expanded = new Set(['food', 'pizza', 'chicken']);

describe('droppable ids', () => {
  it('round-trips a parent id and ignores non-droppable ids', () => {
    expect(toDroppableId('pizza')).toBe('drop:pizza');
    expect(parseDroppableId(toDroppableId('pizza'))).toBe('pizza');
    expect(parseDroppableId('pizza')).toBeNull();
  });
});

describe('collectVisibleItemIds', () => {
  it('lists expanded descendants and stops at collapsed parents', () => {
    expect(collectVisibleItemIds(root, expanded)).toEqual(['pizza', 'chicken', 'extra', 'beef', 'burger']);
    expect(collectVisibleItemIds(root, new Set(['food']))).toEqual(['pizza', 'burger']);
  });
});

describe('blockedParentIds', () => {
  it('collects the dragged item and its descendants', () => {
    expect([...blockedParentIds(root, 'pizza')]).toEqual(['pizza', 'chicken', 'extra', 'beef']);
    expect(blockedParentIds(root, 'missing').size).toBe(0);
  });
});

describe('canDropUnder', () => {
  it('allows dropping at the root unless the wheel itself is dragged', () => {
    expect(canDropUnder(root, 'burger', null)).toBe(true);
    expect(canDropUnder(root, 'food', null)).toBe(false);
  });

  it('rejects missing nodes and descendant targets', () => {
    expect(canDropUnder(root, 'ghost', 'pizza')).toBe(false);
    expect(canDropUnder(root, 'burger', 'ghost')).toBe(false);
    expect(canDropUnder(root, 'burger', 'pizza')).toBe(true);
    expect(canDropUnder(root, 'pizza', 'pizza')).toBe(false);
    expect(canDropUnder(root, 'pizza', 'chicken')).toBe(false);
  });
});

describe('resolveTreeMove', () => {
  it('reorders a child above its sibling', () => {
    expect(resolveTreeMove(root, expanded, 'beef', 'chicken')).toEqual({
      itemId: 'beef',
      targetParentId: 'pizza',
      index: 0,
    });
  });

  it('reorders a child below a later sibling', () => {
    expect(resolveTreeMove(root, expanded, 'chicken', 'beef')).toEqual({
      itemId: 'chicken',
      targetParentId: 'pizza',
      index: 1,
    });
  });

  it('reorders root items without changing their children', () => {
    expect(resolveTreeMove(root, expanded, 'burger', 'pizza')).toEqual({
      itemId: 'burger',
      targetParentId: null,
      index: 0,
    });
  });

  it('moves an item under another parent via a droppable container', () => {
    expect(resolveTreeMove(root, expanded, 'beef', toDroppableId('burger'))).toEqual({
      itemId: 'beef',
      targetParentId: 'burger',
      index: 0,
    });
  });

  it('keeps an item at the end of its current parent droppable', () => {
    expect(resolveTreeMove(root, expanded, 'beef', toDroppableId('pizza'))).toEqual({
      itemId: 'beef',
      targetParentId: 'pizza',
      index: 1,
    });
  });

  it('drops onto the wheel container as a root sibling', () => {
    expect(resolveTreeMove(root, expanded, 'beef', toDroppableId('food'))).toEqual({
      itemId: 'beef',
      targetParentId: null,
      index: 2,
    });
  });

  it('prevents an item from becoming its own descendant', () => {
    expect(resolveTreeMove(root, expanded, 'pizza', toDroppableId('chicken'))).toBeNull();
    expect(resolveTreeMove(root, expanded, 'pizza', 'extra')).toBeNull();
    expect(resolveTreeMove(root, expanded, 'chicken', toDroppableId('chicken'))).toBeNull();
  });

  it('nests into a collapsed parent that already has children', () => {
    expect(resolveTreeMove(root, new Set(['food']), 'burger', 'pizza')).toEqual({
      itemId: 'burger',
      targetParentId: 'pizza',
      index: 0,
    });
  });

  it('returns null for empty, identical, hidden, or unknown drop targets', () => {
    expect(resolveTreeMove(root, expanded, 'beef', null)).toBeNull();
    expect(resolveTreeMove(root, expanded, 'beef', 'beef')).toBeNull();
    expect(resolveTreeMove(root, expanded, 'food', 'burger')).toBeNull();
    expect(resolveTreeMove(root, new Set(['food']), 'extra', 'burger')).toBeNull();
    expect(resolveTreeMove(root, expanded, 'burger', 'missing')).toBeNull();
  });
});

describe('preferItemCollisions', () => {
  it('prefers sortable items over ancestor droppables', () => {
    expect(
      preferItemCollisions([{ id: toDroppableId('food') }, { id: 'burger' }, { id: 'taco' }]),
    ).toEqual([{ id: 'burger' }, { id: 'taco' }]);
  });

  it('keeps container collisions when no item is under the pointer', () => {
    expect(preferItemCollisions([{ id: toDroppableId('burger') }])).toEqual([
      { id: toDroppableId('burger') },
    ]);
  });
});

describe('treeCollisionDetection', () => {
  beforeEach(() => {
    collisionHarness.pointer = [];
    collisionHarness.closest = [];
  });

  it('uses pointer collisions when any exist', () => {
    collisionHarness.pointer = [{ id: toDroppableId('food') }, { id: 'burger' }];

    expect(treeCollisionDetection({} as never)).toEqual([{ id: 'burger' }]);
  });

  it('falls back to closest-center collisions', () => {
    collisionHarness.closest = [{ id: toDroppableId('pizza') }];

    expect(treeCollisionDetection({} as never)).toEqual([{ id: toDroppableId('pizza') }]);
  });
});
