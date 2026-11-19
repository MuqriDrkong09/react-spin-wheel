import { TEST_DATA_MESSAGES, TEST_DATA_RECORD_COUNTS } from '@/features/test-data-generator/constants';
import {
  datasetFormSchema,
  defaultDatasetFormValues,
  defaultFieldFormValues,
  defaultGenerateFormValues,
  defaultValueFormValues,
  fieldFormSchema,
  generateFormSchema,
  valueFormSchema,
} from '@/features/test-data-generator/schema';

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }): string[] {
  return result.success || !result.error ? [] : result.error.issues.map((issue) => issue.message);
}

describe('datasetFormSchema', () => {
  it('exposes empty defaults for the create dialog', () => {
    expect(defaultDatasetFormValues).toEqual({ name: '', description: '' });
  });

  it('accepts a trimmed name and optional description', () => {
    const result = datasetFormSchema.safeParse({
      name: '  QA Matrix  ',
      description: '  Auth flows  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: 'QA Matrix',
        description: 'Auth flows',
      });
    }
  });

  it('allows an omitted or empty description', () => {
    expect(datasetFormSchema.safeParse({ name: 'QA Matrix' }).success).toBe(true);
    expect(datasetFormSchema.safeParse({ name: 'QA Matrix', description: '' }).success).toBe(true);
    expect(datasetFormSchema.safeParse({ name: 'QA Matrix', description: '   ' }).success).toBe(true);
  });

  it('requires a non-empty name', () => {
    expect(messages(datasetFormSchema.safeParse({ name: '' }))).toContain(
      TEST_DATA_MESSAGES.nameRequired,
    );
    expect(messages(datasetFormSchema.safeParse({ name: '   ' }))).toContain(
      TEST_DATA_MESSAGES.nameRequired,
    );
  });
});

describe('fieldFormSchema', () => {
  it('exposes required-field defaults', () => {
    expect(defaultFieldFormValues).toEqual({
      name: '',
      weight: 1,
      optional: false,
      enabled: true,
    });
  });

  it('accepts a valid parent field and coerces weight strings', () => {
    const result = fieldFormSchema.safeParse({
      name: '  Category  ',
      weight: '2',
      optional: true,
      enabled: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: 'Category',
        weight: 2,
        optional: true,
        enabled: false,
      });
    }
  });

  it('requires a non-empty name', () => {
    expect(
      messages(fieldFormSchema.safeParse({ ...defaultFieldFormValues, name: '   ' })),
    ).toContain(TEST_DATA_MESSAGES.nameRequired);
  });

  it('rejects non-positive or non-finite weights', () => {
    expect(fieldFormSchema.safeParse({ ...defaultFieldFormValues, name: 'Category', weight: 0 }).success).toBe(
      false,
    );
    expect(
      fieldFormSchema.safeParse({ ...defaultFieldFormValues, name: 'Category', weight: -1 }).success,
    ).toBe(false);
    expect(
      fieldFormSchema.safeParse({
        ...defaultFieldFormValues,
        name: 'Category',
        weight: Number.POSITIVE_INFINITY,
      }).success,
    ).toBe(false);
    expect(
      fieldFormSchema.safeParse({ ...defaultFieldFormValues, name: 'Category', weight: Number.NaN })
        .success,
    ).toBe(false);
  });
});

describe('valueFormSchema', () => {
  it('exposes required-value defaults', () => {
    expect(defaultValueFormValues).toEqual({
      name: '',
      weight: 1,
      optional: false,
      enabled: true,
    });
  });

  it('accepts a valid child value and coerces weight strings', () => {
    const result = valueFormSchema.safeParse({
      name: '  Login  ',
      weight: '3',
      optional: true,
      enabled: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: 'Login',
        weight: 3,
        optional: true,
        enabled: true,
      });
    }
  });

  it('requires a non-empty name', () => {
    expect(
      messages(valueFormSchema.safeParse({ ...defaultValueFormValues, name: '' })),
    ).toContain(TEST_DATA_MESSAGES.nameRequired);
  });

  it('rejects non-positive weights', () => {
    expect(
      valueFormSchema.safeParse({ ...defaultValueFormValues, name: 'Login', weight: 0 }).success,
    ).toBe(false);
  });
});

describe('generateFormSchema', () => {
  it('defaults to 10 unique records', () => {
    expect(defaultGenerateFormValues).toEqual({ count: 10, unique: true });
    expect(generateFormSchema.safeParse(defaultGenerateFormValues).success).toBe(true);
  });

  it.each([...TEST_DATA_RECORD_COUNTS])('accepts supported record count %s', (count) => {
    const result = generateFormSchema.safeParse({ count, unique: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(count);
      expect(result.data.unique).toBe(false);
    }
  });

  it('rejects unsupported record counts', () => {
    expect(generateFormSchema.safeParse({ count: 0, unique: true }).success).toBe(false);
    expect(generateFormSchema.safeParse({ count: 25, unique: true }).success).toBe(false);
    expect(generateFormSchema.safeParse({ count: 500, unique: true }).success).toBe(false);
    expect(generateFormSchema.safeParse({ count: '10', unique: true }).success).toBe(false);
  });

  it('requires a boolean unique flag', () => {
    expect(generateFormSchema.safeParse({ count: 10, unique: 'yes' }).success).toBe(false);
    expect(generateFormSchema.safeParse({ count: 10 }).success).toBe(false);
  });
});
