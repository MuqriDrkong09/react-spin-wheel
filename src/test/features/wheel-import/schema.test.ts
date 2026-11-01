import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { importedIdSchema, wheelImportDocumentSchema } from '@/features/wheel-import/schema';

describe('wheel import schema', () => {
  it('accepts optional unique ids on the wheel and recursive items', () => {
    const result = wheelImportDocumentSchema.safeParse({
      format: WHEEL_EXPORT_FORMAT,
      version: WHEEL_EXPORT_VERSION,
      id: 'food-picker',
      name: 'Food Picker',
      items: [
        {
          id: 'pizza',
          name: 'Pizza',
          color: '#ea580c',
          enabled: true,
          weight: 1.5,
          children: [{ id: 'pepperoni', name: 'Pepperoni', color: '#dc2626', enabled: true, weight: 2 }],
        },
      ],
      settings: DEFAULT_WHEEL_SETTINGS,
    });

    expect(result.success).toBe(true);
  });

  it('rejects non-finite weights', () => {
    const result = wheelImportDocumentSchema.safeParse({
      format: WHEEL_EXPORT_FORMAT,
      version: WHEEL_EXPORT_VERSION,
      name: 'Food Picker',
      items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: Number.POSITIVE_INFINITY }],
      settings: DEFAULT_WHEEL_SETTINGS,
    });

    expect(result.success).toBe(false);
  });

  it('rejects duplicate nested ids', () => {
    const result = wheelImportDocumentSchema.safeParse({
      format: WHEEL_EXPORT_FORMAT,
      version: WHEEL_EXPORT_VERSION,
      name: 'Food Picker',
      items: [
        {
          id: 'pizza',
          name: 'Pizza',
          color: '#ea580c',
          enabled: true,
          weight: 1,
          children: [{ id: 'pizza', name: 'Pepperoni', color: '#dc2626', enabled: true, weight: 1 }],
        },
      ],
      settings: DEFAULT_WHEEL_SETTINGS,
    });

    expect(result.success).toBe(false);
  });

  it('rejects unsafe ids', () => {
    expect(importedIdSchema.safeParse('').success).toBe(false);
    expect(importedIdSchema.safeParse('has space').success).toBe(false);
    expect(importedIdSchema.safeParse('../etc').success).toBe(false);
    expect(importedIdSchema.safeParse('pizza_1').success).toBe(true);
  });
});
