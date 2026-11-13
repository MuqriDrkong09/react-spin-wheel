import { ZodError } from 'zod';

import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { EXPORT_MESSAGES } from '@/features/wheel-export/constants';
import { wheelExportDocumentSchema } from '@/features/wheel-export/schema';
import { createWheelExport } from '@/features/wheel-export/utils/createWheelExport';
import type { Wheel, WheelItem } from '@/types/wheel';

function createItem(overrides: Partial<WheelItem> & Pick<WheelItem, 'id' | 'name'>): WheelItem {
  return {
    color: '#4f46e5',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createWheel(overrides: Partial<Wheel> = {}): Wheel {
  return {
    id: 'food',
    name: 'Food Picker',
    items: [createItem({ id: 'pizza', name: 'Pizza' })],
    settings: DEFAULT_WHEEL_SETTINGS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('createWheelExport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates and serializes a portable json document', () => {
    const result = createWheelExport(createWheel());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.filename).toBe('food-picker-wheel.json');
    expect(result.json).toContain('"name": "Food Picker"');
    expect(result.json).toContain('"name": "Pizza"');
    expect(result.json).not.toContain('"id"');
    expect(result.json).not.toContain('"createdAt"');
    expect(result.document.items).toHaveLength(1);
  });

  it('rejects a missing wheel name', () => {
    expect(createWheelExport(createWheel({ name: '   ' }))).toEqual({
      ok: false,
      error: EXPORT_MESSAGES.nameRequired,
    });
  });

  it('rejects a wheel with no items', () => {
    expect(createWheelExport(createWheel({ items: [] }))).toEqual({
      ok: false,
      error: EXPORT_MESSAGES.itemsRequired,
    });
  });

  it('rejects an unnamed item', () => {
    expect(createWheelExport(createWheel({ items: [createItem({ id: 'blank', name: '  ' })] }))).toEqual({
      ok: false,
      error: EXPORT_MESSAGES.itemNameRequired,
    });
  });

  it('rejects an invalid item color', () => {
    expect(
      createWheelExport(
        createWheel({
          items: [createItem({ id: 'pizza', name: 'Pizza', color: 'red' as WheelItem['color'] })],
        }),
      ),
    ).toEqual({
      ok: false,
      error: EXPORT_MESSAGES.invalidColor,
    });
  });

  it('rejects an invalid item weight', () => {
    expect(
      createWheelExport(createWheel({ items: [createItem({ id: 'pizza', name: 'Pizza', weight: 0 })] })),
    ).toEqual({
      ok: false,
      error: EXPORT_MESSAGES.invalidWeight,
    });
  });

  it('rejects data that does not match the export schema', () => {
    expect(
      createWheelExport(
        createWheel({
          items: [createItem({ id: 'pizza', name: 'Pizza', description: 'x'.repeat(501) })],
        }),
      ),
    ).toEqual({
      ok: false,
      error: EXPORT_MESSAGES.invalid,
    });
  });

  it('rejects incomplete settings', () => {
    expect(
      createWheelExport(
        createWheel({
          settings: {
            ...DEFAULT_WHEEL_SETTINGS,
            maxRotations: 1,
            minRotations: 4,
          },
        }),
      ),
    ).toEqual({
      ok: false,
      error: EXPORT_MESSAGES.invalidSettings,
    });
  });

  it('falls back to a generic invalid message when issues have no path', () => {
    vi.spyOn(wheelExportDocumentSchema, 'safeParse').mockReturnValueOnce({
      success: false,
      error: new ZodError([]),
    });

    expect(createWheelExport(createWheel())).toEqual({
      ok: false,
      error: EXPORT_MESSAGES.invalid,
    });
  });

  it('rejects nested empty item collections', () => {
    vi.spyOn(wheelExportDocumentSchema, 'safeParse').mockReturnValueOnce({
      success: false,
      error: new ZodError([
        {
          code: 'too_small',
          minimum: 1,
          type: 'array',
          inclusive: true,
          exact: false,
          message: 'Required',
          path: ['items', 0, 'items'],
        },
      ]),
    });

    expect(createWheelExport(createWheel())).toEqual({
      ok: false,
      error: EXPORT_MESSAGES.itemsRequired,
    });
  });

  it('rejects invalid appearance settings', () => {
    vi.spyOn(wheelExportDocumentSchema, 'safeParse').mockReturnValueOnce({
      success: false,
      error: new ZodError([
        {
          code: 'custom',
          message: 'Invalid',
          path: ['settings', 'appearance', 'pointerColor'],
        },
      ]),
    });

    expect(createWheelExport(createWheel())).toEqual({
      ok: false,
      error: EXPORT_MESSAGES.invalidSettings,
    });
  });
});
