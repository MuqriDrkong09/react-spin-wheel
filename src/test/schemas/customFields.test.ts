import {
  customFieldDefinitionSchema,
  customFieldDefinitionsSchema,
  customFieldValueSchema,
  customFieldValuesSchema,
  emptyCustomFieldValues,
} from '@/schemas/customFields';
import { CUSTOM_FIELD_TYPE } from '@/types/customFields';
import { parseWheel, parseWheelItem } from '@/schemas/parse';
import { DEFAULT_WHEEL_APPEARANCE } from '@/constants/wheelAppearance';
import { SELECTION_MODE } from '@/types/wheel';

function definition(overrides: Record<string, unknown> = {}) {
  return {
    id: 'f1',
    key: 'cuisine',
    label: 'Cuisine',
    type: CUSTOM_FIELD_TYPE.text,
    ...overrides,
  };
}

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }): string[] {
  return result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? []);
}

describe('customFieldDefinitionSchema', () => {
  it('accepts a valid text definition', () => {
    const result = customFieldDefinitionSchema.safeParse(definition());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        id: 'f1',
        key: 'cuisine',
        label: 'Cuisine',
        type: CUSTOM_FIELD_TYPE.text,
      });
    }
  });

  it('trims label and key', () => {
    const result = customFieldDefinitionSchema.safeParse(
      definition({ key: '  spicy  ', label: '  Spicy  ' }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.key).toBe('spicy');
      expect(result.data.label).toBe('Spicy');
    }
  });

  it('accepts optional required and options for select types', () => {
    const select = customFieldDefinitionSchema.safeParse(
      definition({
        key: 'size',
        label: 'Size',
        type: CUSTOM_FIELD_TYPE.select,
        options: [' Small ', 'Large'],
        required: true,
      }),
    );
    const multi = customFieldDefinitionSchema.safeParse(
      definition({
        id: 'f2',
        key: 'tags',
        label: 'Tags',
        type: CUSTOM_FIELD_TYPE.multiSelect,
        options: ['Veg'],
      }),
    );

    expect(select.success).toBe(true);
    if (select.success) {
      expect(select.data.options).toEqual(['Small', 'Large']);
      expect(select.data.required).toBe(true);
    }
    expect(multi.success).toBe(true);
  });

  it('requires options for select and multi-select', () => {
    for (const type of [CUSTOM_FIELD_TYPE.select, CUSTOM_FIELD_TYPE.multiSelect]) {
      const result = customFieldDefinitionSchema.safeParse(
        definition({ key: 'size', label: 'Size', type, options: [] }),
      );

      expect(result.success).toBe(false);
      expect(messages(result)).toContain('Select fields need at least one option');
    }

    expect(
      customFieldDefinitionSchema.safeParse(
        definition({ key: 'size', label: 'Size', type: CUSTOM_FIELD_TYPE.select }),
      ).success,
    ).toBe(false);
  });

  it('accepts every supported field type', () => {
    for (const type of Object.values(CUSTOM_FIELD_TYPE)) {
      const needsOptions =
        type === CUSTOM_FIELD_TYPE.select || type === CUSTOM_FIELD_TYPE.multiSelect;
      const result = customFieldDefinitionSchema.safeParse(
        definition({
          key: `field_${type}`,
          label: type,
          type,
          ...(needsOptions ? { options: ['One'] } : {}),
        }),
      );

      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid keys, labels, ids, and types', () => {
    expect(customFieldDefinitionSchema.safeParse(definition({ key: '1bad' })).success).toBe(false);
    expect(customFieldDefinitionSchema.safeParse(definition({ key: 'bad-key' })).success).toBe(
      false,
    );
    expect(customFieldDefinitionSchema.safeParse(definition({ key: '' })).success).toBe(false);
    expect(customFieldDefinitionSchema.safeParse(definition({ key: 'a'.repeat(65) })).success).toBe(
      false,
    );
    expect(customFieldDefinitionSchema.safeParse(definition({ label: '' })).success).toBe(false);
    expect(
      customFieldDefinitionSchema.safeParse(definition({ label: 'A'.repeat(81) })).success,
    ).toBe(false);
    expect(customFieldDefinitionSchema.safeParse(definition({ id: '' })).success).toBe(false);
    expect(customFieldDefinitionSchema.safeParse(definition({ type: 'mystery' })).success).toBe(
      false,
    );
  });

  it('rejects empty option entries and more than 50 options', () => {
    expect(
      customFieldDefinitionSchema.safeParse(
        definition({
          type: CUSTOM_FIELD_TYPE.select,
          options: ['Good', '  '],
        }),
      ).success,
    ).toBe(false);

    expect(
      customFieldDefinitionSchema.safeParse(
        definition({
          type: CUSTOM_FIELD_TYPE.select,
          options: Array.from({ length: 51 }, (_, index) => `Option ${index}`),
        }),
      ).success,
    ).toBe(false);
  });
});

describe('customFieldValueSchema', () => {
  it('accepts string, finite number, boolean, string array, and null', () => {
    expect(customFieldValueSchema.safeParse('Italian').success).toBe(true);
    expect(customFieldValueSchema.safeParse(25).success).toBe(true);
    expect(customFieldValueSchema.safeParse(false).success).toBe(true);
    expect(customFieldValueSchema.safeParse(['veg', 'spicy']).success).toBe(true);
    expect(customFieldValueSchema.safeParse(null).success).toBe(true);
  });

  it('rejects non-finite numbers, objects, and mixed arrays', () => {
    expect(customFieldValueSchema.safeParse(Number.NaN).success).toBe(false);
    expect(customFieldValueSchema.safeParse(Number.POSITIVE_INFINITY).success).toBe(false);
    expect(customFieldValueSchema.safeParse({ nope: true }).success).toBe(false);
    expect(customFieldValueSchema.safeParse([1, 2]).success).toBe(false);
    expect(customFieldValueSchema.safeParse(undefined).success).toBe(false);
  });
});

describe('customFieldDefinitionsSchema', () => {
  it('keeps valid definitions and soft-drops invalid ones', () => {
    expect(
      customFieldDefinitionsSchema.safeParse([
        definition(),
        { id: 'bad' },
        definition({
          id: 'f2',
          key: 'size',
          label: 'Size',
          type: CUSTOM_FIELD_TYPE.select,
          options: ['Small'],
        }),
      ]).data,
    ).toEqual([
      {
        id: 'f1',
        key: 'cuisine',
        label: 'Cuisine',
        type: CUSTOM_FIELD_TYPE.text,
      },
      {
        id: 'f2',
        key: 'size',
        label: 'Size',
        type: CUSTOM_FIELD_TYPE.select,
        options: ['Small'],
      },
    ]);
  });

  it('returns an empty array for an empty input list', () => {
    expect(customFieldDefinitionsSchema.safeParse([]).data).toEqual([]);
  });

  it('rejects a non-array input', () => {
    expect(customFieldDefinitionsSchema.safeParse({ id: 'f1' }).success).toBe(false);
  });
});

describe('customFieldValuesSchema', () => {
  it('soft-parses custom field values and drops invalid entries', () => {
    expect(
      customFieldValuesSchema.safeParse({
        a: 'Italian',
        b: 25,
        c: false,
        d: ['veg'],
        e: null,
        bad: { nope: true },
        worse: Number.NaN,
      }).data,
    ).toEqual({
      a: 'Italian',
      b: 25,
      c: false,
      d: ['veg'],
      e: null,
    });
  });

  it('rejects a non-object input', () => {
    expect(customFieldValuesSchema.safeParse(['Italian']).success).toBe(false);
  });
});

describe('emptyCustomFieldValues', () => {
  it('returns a fresh empty record', () => {
    const first = emptyCustomFieldValues();
    const second = emptyCustomFieldValues();

    expect(first).toEqual({});
    expect(second).toEqual({});
    expect(first).not.toBe(second);
  });
});

describe('custom field schema integration', () => {
  it('keeps legacy wheels and items without custom fields', () => {
    const item = parseWheelItem({
      id: 'pizza',
      name: 'Pizza',
      color: '#ea580c',
      enabled: true,
      weight: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(item.ok).toBe(true);

    const wheel = parseWheel({
      id: 'wheel-1',
      name: 'Food',
      items: [],
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
        appearance: DEFAULT_WHEEL_APPEARANCE,
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(wheel.ok).toBe(true);
  });
});
