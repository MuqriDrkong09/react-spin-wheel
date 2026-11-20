import { CUSTOM_FIELD_TYPE, isCustomFieldType } from '@/types/customFields';

describe('customFields types', () => {
  it('exposes every supported custom field type', () => {
    expect(CUSTOM_FIELD_TYPE).toEqual({
      text: 'text',
      number: 'number',
      boolean: 'boolean',
      select: 'select',
      multiSelect: 'multiSelect',
      date: 'date',
      url: 'url',
    });
  });

  it('accepts known custom field types', () => {
    for (const type of Object.values(CUSTOM_FIELD_TYPE)) {
      expect(isCustomFieldType(type)).toBe(true);
    }

    expect(isCustomFieldType('text')).toBe(true);
    expect(isCustomFieldType('multiSelect')).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(isCustomFieldType('')).toBe(false);
    expect(isCustomFieldType('mystery')).toBe(false);
    expect(isCustomFieldType('TEXT')).toBe(false);
    expect(isCustomFieldType('multi-select')).toBe(false);
    expect(isCustomFieldType('select ')).toBe(false);
  });
});
