import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { wheelExportDocumentSchema } from '@/features/wheel-export/schema';

describe('wheelExportDocumentSchema', () => {
  it('accepts a complete export document', () => {
    const result = wheelExportDocumentSchema.safeParse({
      format: WHEEL_EXPORT_FORMAT,
      version: WHEEL_EXPORT_VERSION,
      name: 'Food Picker',
      items: [
        {
          name: 'Pizza',
          color: '#ea580c',
          enabled: true,
          weight: 1,
          children: [{ name: 'Pepperoni', color: '#dc2626', enabled: true, weight: 2 }],
        },
      ],
      settings: DEFAULT_WHEEL_SETTINGS,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an unknown format', () => {
    const result = wheelExportDocumentSchema.safeParse({
      format: 'other',
      version: WHEEL_EXPORT_VERSION,
      name: 'Food Picker',
      items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
      settings: DEFAULT_WHEEL_SETTINGS,
    });

    expect(result.success).toBe(false);
  });
});
