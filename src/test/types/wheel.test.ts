import {
  CENTER_BUTTON_STYLE,
  ITEM_CONDITION_KIND,
  SELECTION_MODE,
  SPIN_SESSION_STATUS,
  WHEEL_SIZE,
  WHEEL_THEME,
  isSelectionMode,
  isWheelItemBranch,
  isWheelItemLeaf,
  type Wheel,
  type WheelItem,
  type WheelItemDraft,
} from '@/types/wheel';

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
    const emptyChildren: WheelItem = {
      id: 'empty',
      name: 'Empty',
      color: '#94a3b8',
      enabled: true,
      weight: 1,
      children: [],
      ...timestamps,
    };

    expect(parent).toBeDefined();
    expect(child).toBeDefined();
    expect(parent ? isWheelItemBranch(parent) : false).toBe(true);
    expect(child ? isWheelItemLeaf(child) : false).toBe(true);
    expect(isWheelItemBranch(emptyChildren)).toBe(false);
    expect(isWheelItemLeaf(emptyChildren)).toBe(true);
  });

  it('accepts known selection modes and rejects others', () => {
    expect(SELECTION_MODE).toEqual({
      manual: 'manual',
      automatic: 'automatic',
      ask: 'ask',
    });
    expect(isSelectionMode(SELECTION_MODE.manual)).toBe(true);
    expect(isSelectionMode(SELECTION_MODE.automatic)).toBe(true);
    expect(isSelectionMode(SELECTION_MODE.ask)).toBe(true);
    expect(isSelectionMode('random')).toBe(false);
    expect(isSelectionMode('')).toBe(false);
  });

  it('exposes session, condition, theme, size, and button constants', () => {
    expect(SPIN_SESSION_STATUS).toEqual({
      inProgress: 'in_progress',
      completed: 'completed',
      cancelled: 'cancelled',
    });
    expect(ITEM_CONDITION_KIND).toEqual({
      always: 'always',
      requiresSelectedItem: 'requires_selected_item',
      maxWins: 'max_wins',
      minWeight: 'min_weight',
    });
    expect(WHEEL_THEME).toEqual({
      classic: 'classic',
      neon: 'neon',
      pastel: 'pastel',
      minimal: 'minimal',
      dark: 'dark',
      rainbow: 'rainbow',
      custom: 'custom',
    });
    expect(WHEEL_SIZE).toEqual({ sm: 'sm', md: 'md', lg: 'lg' });
    expect(CENTER_BUTTON_STYLE).toEqual({
      filled: 'filled',
      outlined: 'outlined',
      ghost: 'ghost',
    });
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
        selectionMode: SELECTION_MODE.manual,
        removeWinner: false,
        skipDisabledItems: true,
        appearance: {
          title: 'Pizza',
          size: WHEEL_SIZE.md,
          theme: WHEEL_THEME.classic,
          segmentColors: ['#ef4444', '#f97316'],
          textColor: '#0f172a',
          pointerColor: '#111111',
          borderWidth: 2,
          borderColor: '#ffffff',
          fontSize: 14,
          fontWeight: 600,
          background: '#ffffff',
          centerButtonStyle: CENTER_BUTTON_STYLE.filled,
          centerButtonColor: '#111111',
          centerButtonTextColor: '#ffffff',
        },
      },
      conditions: [
        { id: 'always-chicken', itemId: 'chicken-pepperoni', kind: ITEM_CONDITION_KIND.always },
      ],
      ...timestamps,
    } as const satisfies Wheel;

    expect(wheel.items[1]?.children?.[2]?.name).toBe('Large');
    expect(wheel.conditions?.[0]?.kind).toBe(ITEM_CONDITION_KIND.always);
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
