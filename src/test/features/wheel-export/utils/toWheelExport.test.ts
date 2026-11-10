import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { toWheelExportDocument } from '@/features/wheel-export/utils/toWheelExport';
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
        description: '  ',
        icon: '',
        children: [createItem({ id: 'pepperoni', name: 'Pepperoni', color: '#dc2626' })],
      }),
    ],
    settings: DEFAULT_WHEEL_SETTINGS,
    conditions: [
      {
        id: 'always',
        itemId: 'pizza',
        kind: ITEM_CONDITION_KIND.always,
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
    ...overrides,
  };
}

describe('toWheelExportDocument', () => {
  it('exports configuration, hierarchical items, and settings without app state', () => {
    const document = toWheelExportDocument(createWheel());

    expect(document).toEqual({
      format: WHEEL_EXPORT_FORMAT,
      version: WHEEL_EXPORT_VERSION,
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
          children: [
            {
              name: 'Pepperoni',
              color: '#dc2626',
              enabled: true,
              weight: 1,
            },
          ],
        },
      ],
      settings: DEFAULT_WHEEL_SETTINGS,
    });
    expect(document).not.toHaveProperty('id');
    expect(document).not.toHaveProperty('createdAt');
    expect(document).not.toHaveProperty('updatedAt');
    expect(document).not.toHaveProperty('conditions');
    expect(JSON.stringify(document)).not.toContain('food-picker');
    expect(JSON.stringify(document)).not.toContain('pepperoni');
  });

  it('omits blank optional wheel fields', () => {
    const document = toWheelExportDocument(
      createWheel({
        description: '   ',
        category: undefined,
        icon: '',
      }),
    );

    expect(document.description).toBeUndefined();
    expect(document.category).toBeUndefined();
    expect(document.icon).toBeUndefined();
  });

  it('omits empty children arrays and copies appearance segment colors', () => {
    const wheel = createWheel({
      items: [createItem({ id: 'sushi', name: 'Sushi', children: [] })],
    });
    const document = toWheelExportDocument(wheel);

    expect(document.items[0]).not.toHaveProperty('children');
    expect(document.settings.appearance.segmentColors).toEqual(
      wheel.settings.appearance.segmentColors,
    );
    expect(document.settings.appearance.segmentColors).not.toBe(
      wheel.settings.appearance.segmentColors,
    );
  });
});
