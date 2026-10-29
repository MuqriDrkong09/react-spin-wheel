import { ITEM_COLORS } from '@/constants/wheel';
import { defaultItemFormValues } from '@/features/wheel-editor/schema';
import { colorForIndex, toItemDraft, toItemPatch } from '@/features/wheel-editor/utils/itemDraft';

describe('toItemDraft', () => {
  it('maps form values onto a new wheel item', () => {
    expect(
      toItemDraft(
        {
          ...defaultItemFormValues,
          name: 'Pizza',
          description: 'Dinner',
          icon: '🍕',
          color: '#ea580c',
          weight: 2,
          enabled: false,
        },
        0,
      ),
    ).toEqual({
      name: 'Pizza',
      description: 'Dinner',
      icon: '🍕',
      color: '#ea580c',
      weight: 2,
      enabled: false,
    });
  });

  it('omits blank text and uses the palette when the color is not hex', () => {
    expect(toItemDraft({ ...defaultItemFormValues, name: 'Sushi', color: 'red' }, 1)).toEqual({
      name: 'Sushi',
      description: undefined,
      icon: undefined,
      color: ITEM_COLORS[1],
      enabled: true,
      weight: 1,
    });
  });
});

describe('toItemPatch', () => {
  it('maps form values without children or timestamps', () => {
    expect(
      toItemPatch({
        ...defaultItemFormValues,
        name: 'Deep Dish',
        description: 'Thick crust',
        icon: '🍕',
        color: '#ea580c',
        weight: 2,
        enabled: false,
      }),
    ).toEqual({
      name: 'Deep Dish',
      description: 'Thick crust',
      icon: '🍕',
      color: '#ea580c',
      weight: 2,
      enabled: false,
    });
  });

  it('omits color when the value is not hex', () => {
    expect(toItemPatch({ ...defaultItemFormValues, name: 'Plain', color: '' })).toEqual({
      name: 'Plain',
      description: undefined,
      icon: undefined,
      enabled: true,
      weight: 1,
    });
  });
});

describe('colorForIndex', () => {
  it('cycles palette colors', () => {
    expect(colorForIndex(0)).toBe(ITEM_COLORS[0]);
    expect(colorForIndex(ITEM_COLORS.length)).toBe(ITEM_COLORS[0]);
  });

  it('falls back to indigo when a palette slot is missing', async () => {
    vi.resetModules();
    vi.doMock('@/constants/wheel', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/constants/wheel')>();
      return { ...actual, ITEM_COLORS: [] };
    });

    const { colorForIndex: colorWithEmptyPalette } = await import(
      '@/features/wheel-editor/utils/itemDraft'
    );

    expect(colorWithEmptyPalette(0)).toBe('#4f46e5');
  });
});
