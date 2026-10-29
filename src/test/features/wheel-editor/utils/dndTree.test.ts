import { TREE_NODE_KIND, type EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import {
  canDropUnder,
  preferItemCollisions,
  resolveTreeMove,
  toDroppableId,
} from '@/features/wheel-editor/utils/dndTree';

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

describe('resolveTreeMove', () => {
  it('reorders a child above its sibling', () => {
    expect(resolveTreeMove(root, expanded, 'beef', 'chicken')).toEqual({
      itemId: 'beef',
      targetParentId: 'pizza',
      index: 0,
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

  it('prevents an item from becoming its own descendant', () => {
    expect(canDropUnder(root, 'pizza', 'pizza')).toBe(false);
    expect(canDropUnder(root, 'pizza', 'chicken')).toBe(false);
    expect(canDropUnder(root, 'pizza', 'extra')).toBe(false);
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
