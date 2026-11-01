import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WHEEL_SHARE_FORMAT, WHEEL_SHARE_VERSION } from '@/features/wheel-share/constants';
import { toShareDocument } from '@/features/wheel-share/utils/toShareDocument';
import { ITEM_CONDITION_KIND, type Wheel, type WheelItem } from '@/types/wheel';

function createItem(overrides: Partial<WheelItem> & Pick<WheelItem, 'id' | 'name'>): WheelItem {
  return {
    color: '#4f46e5',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

function createWheel(overrides: Partial<Wheel> = {}): Wheel {
  return {
    id: 'food-picker',
    name: 'Food Picker',
    description: ' Weekend dinner ',
    category: ' Food ',
    icon: '🍕',
    items: [
      createItem({
        id: 'pizza',
        name: 'Pizza',
        children: [createItem({ id: 'pepperoni', name: 'Pepperoni', color: '#dc2626' })],
      }),
    ],
    settings: DEFAULT_WHEEL_SETTINGS,
    conditions: [{ id: 'always', itemId: 'pizza', kind: ITEM_CONDITION_KIND.always }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
    ...overrides,
  };
}

describe('toShareDocument', () => {
  it('serializes wheel structure without private application state', () => {
    const now = new Date('2026-11-01T00:00:00.000Z');
    const document = toShareDocument(createWheel(), now, 60_000);

    expect(document.format).toBe(WHEEL_SHARE_FORMAT);
    expect(document.version).toBe(WHEEL_SHARE_VERSION);
    expect(document.createdAt).toBe('2026-11-01T00:00:00.000Z');
    expect(document.expiresAt).toBe('2026-11-01T00:01:00.000Z');
    expect(document.wheel).toEqual({
      name: 'Food Picker',
      description: 'Weekend dinner',
      category: 'Food',
      icon: '🍕',
      items: [
        {
          name: 'Pizza',
          color: '#4f46e5',
          enabled: true,
          weight: 1,
          children: [{ name: 'Pepperoni', color: '#dc2626', enabled: true, weight: 1 }],
        },
      ],
      settings: DEFAULT_WHEEL_SETTINGS,
    });
    expect(JSON.stringify(document)).not.toContain('food-picker');
    expect(JSON.stringify(document)).not.toContain('pepperoni');
    expect(document).not.toHaveProperty('conditions');
    expect(document.wheel).not.toHaveProperty('id');
  });
});
