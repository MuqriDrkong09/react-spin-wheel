import { CUSTOM_FIELD_TYPE, type CustomFieldDefinition } from '@/types/customFields';
import {
  coerceCustomFieldValue,
  defaultCustomFieldFormValues,
  formatCustomFieldValue,
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

const tags: CustomFieldDefinition = {
  id: 'f-tags',
  key: 'tags',
  label: 'Tags',
  type: CUSTOM_FIELD_TYPE.multiSelect,
  options: ['veg', 'meat'],
};

describe('customFields utils', () => {
  it('slugifies labels and keeps keys unique', () => {
    expect(slugifyFieldKey('Cuisine Type')).toBe('cuisine_type');
    expect(uniqueFieldKey('cuisine', ['cuisine'])).toBe('cuisine_2');
  });

  it('sanitizes pizza-style field values', () => {
    const result = sanitizeCustomFieldValues([cuisine, price, spicy], {
      'f-cuisine': 'Italian',
      'f-price': '25',
      'f-spicy': false,
      'unknown': 'drop-me',
    });

    expect(result.ok).toBe(true);
    expect(result.values).toEqual({
      'f-cuisine': 'Italian',
      'f-price': 25,
      'f-spicy': false,
    });
  });

  it('rejects invalid required numbers and select options', () => {
    expect(sanitizeCustomFieldValues([price], {}).ok).toBe(false);
    expect(coerceCustomFieldValue(tags, ['ghost']).ok).toBe(false);
    expect(formatCustomFieldValue(spicy, true)).toBe('Yes');
  });

  it('builds form defaults without overwriting existing values', () => {
    expect(defaultCustomFieldFormValues([cuisine, spicy], { 'f-cuisine': 'Italian' })).toEqual({
      'f-cuisine': 'Italian',
      'f-spicy': false,
    });
  });
});
