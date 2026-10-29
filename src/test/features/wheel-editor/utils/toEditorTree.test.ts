import {
  collectExpandedIds,
  collectNodeIds,
  countDescendants,
  findTreeNode,
  toEditorTree,
} from '@/features/wheel-editor/utils/toEditorTree';
import type { Wheel } from '@/types/wheel';

const foodWheel = {
  id: 'food',
  name: 'Food Wheel',
  icon: '📁',
  description: 'Dinner options',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  settings: {
    durationMs: 4000,
    minRotations: 4,
    maxRotations: 8,
    soundEnabled: true,
    confettiEnabled: true,
    eliminationMode: false,
    selectionMode: 'manual',
    removeWinner: false,
    skipDisabledItems: true,
  },
  items: [
    {
      id: 'pizza',
      name: 'Pizza',
      icon: '🍕',
      color: '#ea580c',
      enabled: true,
      weight: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      children: [
        {
          id: 'chicken',
          name: 'Chicken Pepperoni',
          icon: '🍗',
          color: '#ca8a04',
          enabled: true,
          weight: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
    {
      id: 'sushi',
      name: 'Sushi',
      icon: '🍣',
      color: '#0f766e',
      enabled: true,
      weight: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
} as Wheel;

describe('toEditorTree', () => {
  it('maps a wheel into a recursive editor tree', () => {
    const tree = toEditorTree(foodWheel);

    expect(tree.kind).toBe('wheel');
    expect(tree.icon).toBe('📁');
    expect(tree.description).toBe('Dinner options');
    expect(tree.enabled).toBe(true);
    expect(tree.weight).toBe(1);
    expect(tree.children.map((child) => child.name)).toEqual(['Pizza', 'Sushi']);
    expect(tree.children[0]?.kind).toBe('item');
    expect(tree.children[0]?.children[0]?.name).toBe('Chicken Pepperoni');
    expect(tree.children[1]?.children).toEqual([]);
  });

  it('uses a folder icon when the wheel has none', () => {
    expect(toEditorTree({ ...foodWheel, icon: '' }).icon).toBe('📁');
    expect(toEditorTree({ ...foodWheel, icon: undefined }).icon).toBe('📁');
  });
});

describe('collectExpandedIds', () => {
  it('expands the wheel and nodes that already have children', () => {
    const tree = toEditorTree(foodWheel);

    expect(collectExpandedIds(tree)).toEqual(['food', 'pizza']);
    expect(collectExpandedIds(tree.children[1]!)).toEqual([]);
  });
});

describe('collectNodeIds', () => {
  it('lists every node in depth-first order', () => {
    expect(collectNodeIds(toEditorTree(foodWheel))).toEqual(['food', 'pizza', 'chicken', 'sushi']);
  });
});

describe('countDescendants', () => {
  it('counts nested descendants', () => {
    const tree = toEditorTree(foodWheel);

    expect(countDescendants(tree)).toBe(3);
    expect(countDescendants(tree.children[0]!)).toBe(1);
    expect(countDescendants(tree.children[1]!)).toBe(0);
  });
});

describe('findTreeNode', () => {
  it('finds the wheel, a nested child, and misses unknown ids', () => {
    const tree = toEditorTree(foodWheel);

    expect(findTreeNode(tree, 'food')?.kind).toBe('wheel');
    expect(findTreeNode(tree, 'chicken')?.name).toBe('Chicken Pepperoni');
    expect(findTreeNode(tree, 'sushi')?.name).toBe('Sushi');
    expect(findTreeNode(tree, 'missing')).toBeUndefined();
  });
});
