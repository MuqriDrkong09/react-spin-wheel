import { toEditorTree, collectExpandedIds, countDescendants } from '@/features/wheel-editor/utils/toEditorTree';
import type { Wheel } from '@/types/wheel';

const foodWheel = {
  id: 'food',
  name: 'Food Wheel',
  icon: '📁',
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
    expect(tree.children.map((child) => child.name)).toEqual(['Pizza', 'Sushi']);
    expect(tree.children[0]?.children[0]?.name).toBe('Chicken Pepperoni');
  });

  it('expands the wheel and nodes that already have children', () => {
    expect(collectExpandedIds(toEditorTree(foodWheel))).toEqual(['food', 'pizza']);
  });

  it('counts nested descendants', () => {
    expect(countDescendants(toEditorTree(foodWheel))).toBe(3);
    expect(countDescendants(toEditorTree(foodWheel).children[0]!)).toBe(1);
  });
});
