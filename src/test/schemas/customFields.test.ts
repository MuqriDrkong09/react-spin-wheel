import {
  customFieldDefinitionSchema,
  customFieldDefinitionsSchema,
  customFieldValuesSchema,
} from '@/schemas/customFields';
import { CUSTOM_FIELD_TYPE } from '@/types/customFields';
import { parseWheel, parseWheelItem } from '@/schemas/parse';
import { DEFAULT_WHEEL_APPEARANCE } from '@/constants/wheelAppearance';
import { SELECTION_MODE } from '@/types/wheel';

describe('custom field schemas', () => {
  it('accepts valid definitions and soft-drops invalid ones', () => {
    const ok = customFieldDefinitionSchema.safeParse({
      id: 'f1',
      key: 'cuisine',
      label: 'Cuisine',
      type: CUSTOM_FIELD_TYPE.text,
    });
    expect(ok.success).toBe(true);

    const selectNeedsOptions = customFieldDefinitionSchema.safeParse({
      id: 'f2',
      key: 'size',
      label: 'Size',
      type: CUSTOM_FIELD_TYPE.select,
    });
    expect(selectNeedsOptions.success).toBe(false);

    expect(
      customFieldDefinitionsSchema.safeParse([
        { id: 'f1', key: 'cuisine', label: 'Cuisine', type: CUSTOM_FIELD_TYPE.text },
        { id: 'bad' },
      ]).data,
    ).toHaveLength(1);
  });

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

  it('soft-parses custom field values on items', () => {
    expect(
      customFieldValuesSchema.safeParse({
        a: 'Italian',
        b: 25,
        c: false,
        d: ['veg'],
        e: null,
        bad: { nope: true },
      }).data,
    ).toEqual({
      a: 'Italian',
      b: 25,
      c: false,
      d: ['veg'],
      e: null,
    });
  });
});
