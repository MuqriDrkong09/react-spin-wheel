import { ITEM_COLORS } from '@/constants/wheel';
import { PRESET_ID } from '@/features/presets/constants';
import { getPreset } from '@/features/presets/data/catalog';
import type { PresetItemDefinition } from '@/features/presets/types';
import { toPreviewItems } from '@/features/presets/utils/toPreviewItems';

const PREVIEW_TIMESTAMP = '1970-01-01T00:00:00.000Z';

const items: readonly PresetItemDefinition[] = [
  { name: 'Plain' },
  {
    name: 'Styled',
    description: 'Has extras',
    icon: '⭐',
    color: '#dc2626',
    weight: 3,
    children: [{ name: 'Child', color: '#16a34a', weight: 2 }],
  },
];

describe('toPreviewItems', () => {
  it('maps nested food options to preview wheel items', () => {
    const food = getPreset(PRESET_ID.food);
    expect(food).toBeDefined();
    if (!food) {
      return;
    }

    const preview = toPreviewItems(food.items);
    const pizza = preview[0];

    expect(preview.map((item) => item.name)).toEqual(['Pizza', 'Burger', 'Noodles', 'Sushi']);
    expect(pizza).toMatchObject({
      id: 'preset-0',
      name: 'Pizza',
      color: ITEM_COLORS[0],
      enabled: true,
      weight: 1,
      createdAt: PREVIEW_TIMESTAMP,
      updatedAt: PREVIEW_TIMESTAMP,
    });
    expect(pizza?.children?.map((item) => item.id)).toEqual(['preset-0-0', 'preset-0-1']);
    expect(pizza?.children?.map((item) => item.name)).toEqual(['Chicken Pepperoni', 'Beef Pepperoni']);
    expect(preview[1]?.children).toBeUndefined();
  });

  it('keeps explicit colors and weights and defaults the rest', () => {
    expect(toPreviewItems(items)).toEqual([
      {
        id: 'preset-0',
        name: 'Plain',
        description: undefined,
        icon: undefined,
        color: ITEM_COLORS[0],
        enabled: true,
        weight: 1,
        createdAt: PREVIEW_TIMESTAMP,
        updatedAt: PREVIEW_TIMESTAMP,
        children: undefined,
      },
      {
        id: 'preset-1',
        name: 'Styled',
        description: 'Has extras',
        icon: '⭐',
        color: '#dc2626',
        enabled: true,
        weight: 3,
        createdAt: PREVIEW_TIMESTAMP,
        updatedAt: PREVIEW_TIMESTAMP,
        children: [
          {
            id: 'preset-1-0',
            name: 'Child',
            description: undefined,
            icon: undefined,
            color: '#16a34a',
            enabled: true,
            weight: 2,
            createdAt: PREVIEW_TIMESTAMP,
            updatedAt: PREVIEW_TIMESTAMP,
            children: undefined,
          },
        ],
      },
    ]);
  });

  it('maps an empty list', () => {
    expect(toPreviewItems([])).toEqual([]);
  });

  it('falls back to indigo when a palette slot is missing', async () => {
    vi.resetModules();
    vi.doMock('@/constants/wheel', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/constants/wheel')>();
      return { ...actual, ITEM_COLORS: [] };
    });

    const { toPreviewItems: mapWithEmptyPalette } = await import('@/features/presets/utils/toPreviewItems');

    expect(mapWithEmptyPalette([{ name: 'Plain' }])[0]?.color).toBe('#4f46e5');
  });
});
