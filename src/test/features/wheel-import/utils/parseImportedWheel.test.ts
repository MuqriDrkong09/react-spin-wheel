import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { IMPORT_MESSAGES, MAX_IMPORT_BYTES } from '@/features/wheel-import/constants';
import {
  parseImportedWheelFile,
  parseImportedWheelJson,
} from '@/features/wheel-import/utils/parseImportedWheel';
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

function validDocument(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

describe('parseImportedWheelJson', () => {
  it('accepts a valid exported wheel including nested children', () => {
    const exported = createWheelExport({
      id: 'food',
      name: 'Food Picker',
      description: 'Weekend dinner',
      category: 'Food',
      items: [
        createItem({
          id: 'pizza',
          name: 'Pizza',
          children: [createItem({ id: 'pepperoni', name: 'Pepperoni', color: '#dc2626' })],
        }),
      ],
      settings: DEFAULT_WHEEL_SETTINGS,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } satisfies Wheel);

    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      return;
    }

    const parsed = parseImportedWheelJson(exported.json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.document.name).toBe('Food Picker');
    expect(parsed.document.items[0]?.children?.[0]?.name).toBe('Pepperoni');
    expect(parsed.document).not.toHaveProperty('createdAt');
  });

  it('rejects malformed json', () => {
    expect(parseImportedWheelJson('{')).toEqual({ ok: false, error: IMPORT_MESSAGES.malformed });
    expect(parseImportedWheelJson('')).toEqual({ ok: false, error: IMPORT_MESSAGES.empty });
    expect(parseImportedWheelJson('[]')).toEqual({ ok: false, error: IMPORT_MESSAGES.notWheel });
    expect(parseImportedWheelJson('null')).toEqual({ ok: false, error: IMPORT_MESSAGES.notWheel });
  });

  it('rejects the wrong format and missing required fields', () => {
    expect(parseImportedWheelJson(JSON.stringify({ name: 'Food Picker' }))).toEqual({
      ok: false,
      error: IMPORT_MESSAGES.notWheel,
    });
    expect(parseImportedWheelJson(JSON.stringify(validDocument({ name: '  ' })))).toEqual({
      ok: false,
      error: IMPORT_MESSAGES.nameRequired,
    });
    expect(parseImportedWheelJson(JSON.stringify(validDocument({ items: [] })))).toEqual({
      ok: false,
      error: IMPORT_MESSAGES.itemsRequired,
    });
  });

  it('rejects invalid colors, weights, and ids', () => {
    expect(
      parseImportedWheelJson(
        JSON.stringify(
          validDocument({
            items: [{ name: 'Pizza', color: 'red', enabled: true, weight: 1 }],
          }),
        ),
      ),
    ).toEqual({ ok: false, error: IMPORT_MESSAGES.invalidColor });

    expect(
      parseImportedWheelJson(
        JSON.stringify(
          validDocument({
            items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: 0 }],
          }),
        ),
      ),
    ).toEqual({ ok: false, error: IMPORT_MESSAGES.invalidWeight });

    expect(
      parseImportedWheelJson(
        JSON.stringify(
          validDocument({
            items: [{ id: 'not valid', name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
          }),
        ),
      ),
    ).toEqual({ ok: false, error: IMPORT_MESSAGES.invalidId });

    expect(
      parseImportedWheelJson(
        JSON.stringify(
          validDocument({
            id: 'same',
            items: [{ id: 'same', name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
          }),
        ),
      ),
    ).toEqual({ ok: false, error: IMPORT_MESSAGES.invalidId });
  });

  it('rejects incomplete settings', () => {
    expect(
      parseImportedWheelJson(
        JSON.stringify(
          validDocument({
            settings: { ...DEFAULT_WHEEL_SETTINGS, durationMs: 0 },
          }),
        ),
      ),
    ).toEqual({ ok: false, error: IMPORT_MESSAGES.invalidSettings });
  });

  it('rejects an unnamed nested item', () => {
    expect(
      parseImportedWheelJson(
        JSON.stringify(
          validDocument({
            items: [
              {
                name: 'Pizza',
                color: '#ea580c',
                enabled: true,
                weight: 1,
                children: [{ name: '  ', color: '#dc2626', enabled: true, weight: 1 }],
              },
            ],
          }),
        ),
      ),
    ).toEqual({ ok: false, error: IMPORT_MESSAGES.itemNameRequired });
  });

  it('rejects invalid nested children', () => {
    expect(
      parseImportedWheelJson(
        JSON.stringify(
          validDocument({
            items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: 1, children: [] }],
          }),
        ),
      ),
    ).toEqual({ ok: false, error: IMPORT_MESSAGES.invalidChildren });
  });

  it('strips untrusted application state from a valid document', () => {
    const parsed = parseImportedWheelJson(
      JSON.stringify({
        ...validDocument({ id: 'imported-wheel' }),
        createdAt: '2020-01-01T00:00:00.000Z',
        favorite: true,
        spinHistory: [{ id: 's1' }],
      }),
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.document.id).toBe('imported-wheel');
    expect(parsed.document).not.toHaveProperty('createdAt');
    expect(parsed.document).not.toHaveProperty('favorite');
    expect(parsed.document).not.toHaveProperty('spinHistory');
  });
});

describe('parseImportedWheelFile', () => {
  it('reads a json file', async () => {
    const file = new File([JSON.stringify(validDocument())], 'food-picker-wheel.json', {
      type: 'application/json',
    });
    const parsed = await parseImportedWheelFile(file);

    expect(parsed.ok).toBe(true);
  });

  it('rejects empty and oversized files', async () => {
    expect(await parseImportedWheelFile(new File([], 'empty.json'))).toEqual({
      ok: false,
      error: IMPORT_MESSAGES.empty,
    });

    const oversized = new File(['x'.repeat(MAX_IMPORT_BYTES + 1)], 'huge.json', {
      type: 'application/json',
    });
    expect(await parseImportedWheelFile(oversized)).toEqual({
      ok: false,
      error: IMPORT_MESSAGES.tooLarge,
    });
  });
});
