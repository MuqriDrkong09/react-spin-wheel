import { ITEM_COLORS } from '@/constants/wheel';
import { defaultItemFormValues } from '@/features/wheel-editor/schema';
import { colorForIndex, toItemDraft, toItemPatch } from '@/features/wheel-editor/utils/itemDraft';
import { CUSTOM_FIELD_TYPE, type CustomFieldDefinition } from '@/types/customFields';

const fieldDefinitions: CustomFieldDefinition[] = [
  {
    id: 'f-cuisine',
    key: 'cuisine',
    label: 'Cuisine',
    type: CUSTOM_FIELD_TYPE.text,
  },
  {
    id: 'f-price',
    key: 'price',
    label: 'Price',
    type: CUSTOM_FIELD_TYPE.number,
    required: true,
  },
];

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
      customFields: undefined,
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
      customFields: undefined,
    });
  });

  it('keeps a hex color and ignores sibling index for drafts', () => {
    expect(
      toItemDraft(
        {
          ...defaultItemFormValues,
          name: 'Taco',
          color: '#16a34a',
        },
        99,
      ).color,
    ).toBe('#16a34a');
  });

  it('includes sanitized custom fields when definitions are provided', () => {
    expect(
      toItemDraft(
        {
          ...defaultItemFormValues,
          name: 'Pizza',
          color: '#ea580c',
          customFields: {
            'f-cuisine': 'Italian',
            'f-price': '25',
          },
        },
        0,
        fieldDefinitions,
      ),
    ).toEqual({
      name: 'Pizza',
      description: undefined,
      icon: undefined,
      color: '#ea580c',
      enabled: true,
      weight: 1,
      customFields: {
        'f-cuisine': 'Italian',
        'f-price': 25,
      },
    });
  });

  it('drops custom fields when sanitization fails', () => {
    expect(
      toItemDraft(
        {
          ...defaultItemFormValues,
          name: 'Pizza',
          color: '#ea580c',
          customFields: {
            'f-cuisine': 'Italian',
            'f-price': '',
          },
        },
        0,
        fieldDefinitions,
      ).customFields,
    ).toBeUndefined();
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
      customFields: undefined,
    });
  });

  it('omits color when the value is not hex', () => {
    expect(toItemPatch({ ...defaultItemFormValues, name: 'Plain', color: '' })).toEqual({
      name: 'Plain',
      description: undefined,
      icon: undefined,
      enabled: true,
      weight: 1,
      customFields: undefined,
    });
  });

  it('omits color when the value does not start with a hash', () => {
    const patch = toItemPatch({
      ...defaultItemFormValues,
      name: 'Plain',
      color: 'orange',
    });

    expect(patch).not.toHaveProperty('color', 'orange');
    expect(patch.color).toBeUndefined();
  });

  it('keeps only non-empty sanitized custom fields', () => {
    expect(
      toItemPatch(
        {
          ...defaultItemFormValues,
          name: 'Pizza',
          customFields: {
            'f-cuisine': '',
            'f-price': '12',
          },
        },
        [
          {
            id: 'f-cuisine',
            key: 'cuisine',
            label: 'Cuisine',
            type: CUSTOM_FIELD_TYPE.text,
          },
          {
            id: 'f-price',
            key: 'price',
            label: 'Price',
            type: CUSTOM_FIELD_TYPE.number,
          },
        ],
      ).customFields,
    ).toEqual({
      'f-price': 12,
    });
  });

  it('clears custom fields when every defined value is empty', () => {
    expect(
      toItemPatch(
        {
          ...defaultItemFormValues,
          name: 'Pizza',
          customFields: {
            'f-cuisine': '  ',
          },
        },
        [
          {
            id: 'f-cuisine',
            key: 'cuisine',
            label: 'Cuisine',
            type: CUSTOM_FIELD_TYPE.text,
          },
        ],
      ).customFields,
    ).toBeUndefined();
  });

  it('sets customFields to undefined when there are no definitions', () => {
    expect(
      toItemPatch({
        ...defaultItemFormValues,
        name: 'Pizza',
        customFields: { 'f-cuisine': 'Italian' },
      }).customFields,
    ).toBeUndefined();
  });

  it('keeps blank description and icon as undefined', () => {
    expect(
      toItemPatch({
        ...defaultItemFormValues,
        name: 'Pizza',
        description: '',
        icon: '',
        color: '#ea580c',
      }),
    ).toMatchObject({
      description: undefined,
      icon: undefined,
      color: '#ea580c',
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
