import {
  isWheelItemBranch,
  isWheelItemLeaf,
  type Wheel,
  type WheelItem,
  type WheelItemDraft,
} from './wheel';

const timestamps = {
  createdAt: '2026-10-21T00:00:00.000Z',
  updatedAt: '2026-10-21T00:00:00.000Z',
} as const;

const sizeChildren: WheelItem[] = [
  {
    id: 'small',
    name: 'Small',
    color: '#6366f1',
    enabled: true,
    weight: 1,
    ...timestamps,
  },
  {
    id: 'medium',
    name: 'Medium',
    color: '#8b5cf6',
    enabled: true,
    weight: 1,
    ...timestamps,
  },
  {
    id: 'large',
    name: 'Large',
    color: '#a855f7',
    enabled: true,
    weight: 1,
    ...timestamps,
  },
];

const pizzaItems = [
  {
    id: 'chicken-pepperoni',
    name: 'Chicken Pepperoni',
    color: '#ef4444',
    enabled: true,
    weight: 1,
    children: sizeChildren.map((item) => ({
      ...item,
      id: `chicken-${item.id}`,
    })),
    ...timestamps,
  },
  {
    id: 'beef-pepperoni',
    name: 'Beef Pepperoni',
    color: '#f97316',
    enabled: true,
    weight: 1,
    children: sizeChildren.map((item) => ({
      ...item,
      id: `beef-${item.id}`,
    })),
    ...timestamps,
  },
] as const satisfies WheelItem[];

describe('wheel domain model', () => {
  it('supports recursive parent-child items', () => {
    const nestedChild = pizzaItems[0].children[0];

    expect(pizzaItems).toHaveLength(2);
    expect(pizzaItems[0].children).toHaveLength(3);
    expect(nestedChild?.name).toBe('Small');
    expect(nestedChild?.children).toBeUndefined();
  });

  it('narrows branch and leaf items', () => {
    const parent = pizzaItems[0];
    const child = parent?.children?.[0];

    expect(parent).toBeDefined();
    expect(child).toBeDefined();
    expect(parent ? isWheelItemBranch(parent) : false).toBe(true);
    expect(child ? isWheelItemLeaf(child) : false).toBe(true);
  });

  it('accepts a complete wheel', () => {
    const wheel = {
      id: 'pizza-wheel',
      name: 'Pizza',
      items: pizzaItems,
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
      ...timestamps,
    } as const satisfies Wheel;

    expect(wheel.items[1]?.children?.[2]?.name).toBe('Large');
  });

  it('accepts recursive drafts without generated fields', () => {
    const draft = {
      name: 'Calzone',
      color: '#22c55e',
      enabled: true,
      weight: 2,
      children: [
        {
          name: 'Small',
          color: '#4ade80',
          enabled: true,
          weight: 1,
        },
      ],
    } as const satisfies WheelItemDraft;

    expect(draft.children?.[0]?.name).toBe('Small');
  });
});
