import { CUSTOM_FIELD_TYPE, type CustomFieldDefinition } from '@/types/customFields';
import {
  coerceCustomFieldValue,
  defaultCustomFieldFormValues,
  defaultValueForType,
  formatCustomFieldValue,
  isEmptyCustomFieldValue,
  sanitizeCustomFieldValues,
  slugifyFieldKey,
  uniqueFieldKey,
} from '@/utils/customFields';

const cuisine: CustomFieldDefinition = {
  id: 'f-cuisine',
  key: 'cuisine',
  label: 'Cuisine',
  type: CUSTOM_FIELD_TYPE.text,
};

const price: CustomFieldDefinition = {
  id: 'f-price',
  key: 'price',
  label: 'Price',
  type: CUSTOM_FIELD_TYPE.number,
  required: true,
};

const spicy: CustomFieldDefinition = {
  id: 'f-spicy',
  key: 'spicy',
  label: 'Spicy',
  type: CUSTOM_FIELD_TYPE.boolean,
};

const size: CustomFieldDefinition = {
  id: 'f-size',
  key: 'size',
  label: 'Size',
  type: CUSTOM_FIELD_TYPE.select,
  options: ['Small', 'Large'],
};

const tags: CustomFieldDefinition = {
  id: 'f-tags',
  key: 'tags',
  label: 'Tags',
  type: CUSTOM_FIELD_TYPE.multiSelect,
  options: ['veg', 'meat'],
};

const servedOn: CustomFieldDefinition = {
  id: 'f-date',
  key: 'served_on',
  label: 'Served on',
  type: CUSTOM_FIELD_TYPE.date,
};

const menuUrl: CustomFieldDefinition = {
  id: 'f-url',
  key: 'menu_url',
  label: 'Menu URL',
  type: CUSTOM_FIELD_TYPE.url,
};

describe('defaultValueForType', () => {
  it('returns type-specific empty defaults', () => {
    expect(defaultValueForType(CUSTOM_FIELD_TYPE.boolean)).toBe(false);
    expect(defaultValueForType(CUSTOM_FIELD_TYPE.multiSelect)).toEqual([]);
    expect(defaultValueForType(CUSTOM_FIELD_TYPE.number)).toBe('');
    expect(defaultValueForType(CUSTOM_FIELD_TYPE.text)).toBe('');
    expect(defaultValueForType(CUSTOM_FIELD_TYPE.select)).toBe('');
    expect(defaultValueForType(CUSTOM_FIELD_TYPE.date)).toBe('');
    expect(defaultValueForType(CUSTOM_FIELD_TYPE.url)).toBe('');
    expect(defaultValueForType('mystery' as CustomFieldDefinition['type'])).toBe('');
  });
});

describe('defaultCustomFieldFormValues', () => {
  it('builds empty defaults for every definition', () => {
    expect(
      defaultCustomFieldFormValues([cuisine, spicy, tags, price, size, servedOn, menuUrl]),
    ).toEqual({
      'f-cuisine': '',
      'f-spicy': false,
      'f-tags': [],
      'f-price': '',
      'f-size': '',
      'f-date': '',
      'f-url': '',
    });
  });

  it('keeps existing non-null values and fills the rest', () => {
    expect(
      defaultCustomFieldFormValues([cuisine, spicy, tags], {
        'f-cuisine': 'Italian',
        'f-spicy': null,
        'f-tags': ['veg'],
      }),
    ).toEqual({
      'f-cuisine': 'Italian',
      'f-spicy': false,
      'f-tags': ['veg'],
    });
  });

  it('returns an empty object when there are no definitions', () => {
    expect(defaultCustomFieldFormValues([])).toEqual({});
  });
});

describe('sanitizeCustomFieldValues', () => {
  it('returns ok with no values when definitions are empty', () => {
    expect(sanitizeCustomFieldValues([], { 'f-cuisine': 'Italian' })).toEqual({
      values: undefined,
      ok: true,
    });
  });

  it('sanitizes pizza-style field values and drops unknown ids', () => {
    const result = sanitizeCustomFieldValues([cuisine, price, spicy], {
      'f-cuisine': 'Italian',
      'f-price': '25',
      'f-spicy': false,
      unknown: 'drop-me',
    });

    expect(result.ok).toBe(true);
    expect(result.values).toEqual({
      'f-cuisine': 'Italian',
      'f-price': 25,
      'f-spicy': false,
    });
  });

  it('treats an undefined values map as empty', () => {
    expect(sanitizeCustomFieldValues([cuisine], undefined)).toEqual({
      ok: true,
      values: undefined,
    });
  });

  it('omits empty optional values from the sanitized map', () => {
    expect(
      sanitizeCustomFieldValues([cuisine, spicy], {
        'f-cuisine': '  ',
        'f-spicy': false,
      }),
    ).toEqual({
      ok: true,
      values: { 'f-spicy': false },
    });
  });

  it('rejects invalid required numbers and select options', () => {
    expect(sanitizeCustomFieldValues([price], {}).ok).toBe(false);
    expect(sanitizeCustomFieldValues([price], {}).error).toBe('Price is required');
    expect(coerceCustomFieldValue(tags, ['ghost']).ok).toBe(false);
  });

  it('fails fast when a value cannot be coerced', () => {
    const result = sanitizeCustomFieldValues([cuisine], { 'f-cuisine': 12 });

    expect(result).toEqual({
      ok: false,
      error: 'Cuisine must be text',
    });
  });
});

describe('coerceCustomFieldValue', () => {
  it('coerces blank inputs to null', () => {
    expect(coerceCustomFieldValue(cuisine, undefined)).toEqual({ ok: true, value: null });
    expect(coerceCustomFieldValue(cuisine, null)).toEqual({ ok: true, value: null });
    expect(coerceCustomFieldValue(cuisine, '')).toEqual({ ok: true, value: null });
  });

  it('coerces text and select values', () => {
    expect(coerceCustomFieldValue(cuisine, '  Italian  ')).toEqual({
      ok: true,
      value: 'Italian',
    });
    expect(coerceCustomFieldValue(cuisine, '   ')).toEqual({ ok: true, value: null });
    expect(coerceCustomFieldValue(cuisine, 12).ok).toBe(false);

    expect(coerceCustomFieldValue(size, 'Large')).toEqual({ ok: true, value: 'Large' });
    expect(coerceCustomFieldValue(size, 'Huge')).toEqual({
      ok: false,
      error: 'Size must be one of the options',
    });
    expect(coerceCustomFieldValue(size, 1).ok).toBe(false);
  });

  it('coerces numbers, booleans, and dates', () => {
    expect(coerceCustomFieldValue(price, 18)).toEqual({ ok: true, value: 18 });
    expect(coerceCustomFieldValue(price, '12.5')).toEqual({ ok: true, value: 12.5 });
    expect(coerceCustomFieldValue(price, 'abc')).toEqual({
      ok: false,
      error: 'Price must be a number',
    });

    expect(coerceCustomFieldValue(spicy, true)).toEqual({ ok: true, value: true });
    expect(coerceCustomFieldValue(spicy, 'yes')).toEqual({
      ok: false,
      error: 'Spicy must be true or false',
    });

    expect(coerceCustomFieldValue(servedOn, '2026-01-15')).toEqual({
      ok: true,
      value: '2026-01-15',
    });
    expect(coerceCustomFieldValue(servedOn, '15-01-2026')).toEqual({
      ok: false,
      error: 'Served on must be a date (YYYY-MM-DD)',
    });
  });

  it('coerces multi-select and url values', () => {
    expect(coerceCustomFieldValue(tags, [' veg ', '', 'meat'])).toEqual({
      ok: true,
      value: ['veg', 'meat'],
    });
    expect(coerceCustomFieldValue(tags, 'veg')).toEqual({
      ok: false,
      error: 'Tags must be a list of options',
    });
    expect(coerceCustomFieldValue(tags, ['veg', 1] as unknown as string[])).toEqual({
      ok: false,
      error: 'Tags must be a list of options',
    });
    expect(coerceCustomFieldValue(tags, ['ghost'])).toEqual({
      ok: false,
      error: 'Tags has an invalid option',
    });

    expect(coerceCustomFieldValue(menuUrl, '  https://example.com/menu  ')).toEqual({
      ok: true,
      value: 'https://example.com/menu',
    });
    expect(coerceCustomFieldValue(menuUrl, '   ')).toEqual({ ok: true, value: null });
    expect(coerceCustomFieldValue(menuUrl, 'ftp://example.com')).toEqual({
      ok: false,
      error: 'Menu URL must be a valid http(s) URL',
    });
    expect(coerceCustomFieldValue(menuUrl, 12)).toEqual({
      ok: false,
      error: 'Menu URL must be a URL',
    });
  });

  it('rejects unsupported field types', () => {
    expect(
      coerceCustomFieldValue(
        { ...cuisine, type: 'mystery' as CustomFieldDefinition['type'] },
        'value',
      ),
    ).toEqual({
      ok: false,
      error: 'Cuisine has an unsupported type',
    });
  });
});

describe('isEmptyCustomFieldValue', () => {
  it('treats nullish, blank strings, and empty arrays as empty', () => {
    expect(isEmptyCustomFieldValue(undefined)).toBe(true);
    expect(isEmptyCustomFieldValue(null)).toBe(true);
    expect(isEmptyCustomFieldValue('')).toBe(true);
    expect(isEmptyCustomFieldValue('  ')).toBe(true);
    expect(isEmptyCustomFieldValue([])).toBe(true);
  });

  it('treats numbers, booleans, and populated values as non-empty', () => {
    expect(isEmptyCustomFieldValue(0)).toBe(false);
    expect(isEmptyCustomFieldValue(false)).toBe(false);
    expect(isEmptyCustomFieldValue('Italian')).toBe(false);
    expect(isEmptyCustomFieldValue(['veg'])).toBe(false);
  });
});

describe('formatCustomFieldValue', () => {
  it('formats empty, boolean, multi-select, and scalar values', () => {
    expect(formatCustomFieldValue(cuisine, undefined)).toBe('—');
    expect(formatCustomFieldValue(cuisine, '')).toBe('—');
    expect(formatCustomFieldValue(spicy, true)).toBe('Yes');
    expect(formatCustomFieldValue(spicy, false)).toBe('No');
    expect(formatCustomFieldValue(tags, ['veg', 'meat'])).toBe('veg, meat');
    expect(formatCustomFieldValue(tags, 'veg')).toBe('veg');
    expect(formatCustomFieldValue(price, 0)).toBe('0');
    expect(formatCustomFieldValue(cuisine, 'Italian')).toBe('Italian');
  });
});

describe('slugifyFieldKey', () => {
  it('slugifies labels and keeps keys unique', () => {
    expect(slugifyFieldKey('Cuisine Type')).toBe('cuisine_type');
    expect(slugifyFieldKey('  Spicy!!! Food  ')).toBe('spicy_food');
    expect(slugifyFieldKey('123 Size')).toBe('field_123_size');
    expect(slugifyFieldKey('!!!')).toBe('field');
    expect(slugifyFieldKey('')).toBe('field');
  });
});

describe('uniqueFieldKey', () => {
  it('returns the base key when it is free', () => {
    expect(uniqueFieldKey('cuisine', [])).toBe('cuisine');
    expect(uniqueFieldKey('cuisine', ['size'])).toBe('cuisine');
  });

  it('appends an incrementing suffix when the key is taken', () => {
    expect(uniqueFieldKey('cuisine', ['cuisine'])).toBe('cuisine_2');
    expect(uniqueFieldKey('cuisine', ['Cuisine', 'cuisine_2'])).toBe('cuisine_3');
  });
});
