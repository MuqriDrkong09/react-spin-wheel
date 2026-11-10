import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import type { WheelImportDocument } from '@/features/wheel-import/types';
import {
  collectExistingIds,
  nextUniqueId,
  toCreateWheelInputFromImport,
  uniqueImportedName,
} from '@/features/wheel-import/utils/toCreateWheelInputFromImport';
import type { Wheel } from '@/types/wheel';
import { createId } from '@/utils/id';

vi.mock('@/utils/id', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/id')>();
  return {
    ...actual,
    createId: vi.fn(actual.createId),
  };
});

const createIdMock = vi.mocked(createId);

const document: WheelImportDocument = {
  format: WHEEL_EXPORT_FORMAT,
  version: WHEEL_EXPORT_VERSION,
  id: 'imported-wheel',
  name: 'Food Picker',
  items: [
    {
      id: 'pizza',
      name: 'Pizza',
      color: '#ea580c',
      enabled: true,
      weight: 1,
      children: [{ id: 'pepperoni', name: 'Pepperoni', color: '#dc2626', enabled: true, weight: 2 }],
    },
  ],
  settings: DEFAULT_WHEEL_SETTINGS,
};

describe('toCreateWheelInputFromImport', () => {
  beforeEach(() => {
    createIdMock.mockImplementation(() => `new-${Math.random().toString(16).slice(2)}`);
  });

  afterEach(() => {
    createIdMock.mockReset();
  });

  it('generates new ids and ignores imported ids', () => {
    const input = toCreateWheelInputFromImport(document, 'Dinner Wheel', new Set(['imported-wheel', 'pizza']));

    expect(input.id).not.toBe('imported-wheel');
    expect(input.name).toBe('Dinner Wheel');
    expect(input.items[0]?.id).not.toBe('pizza');
    expect(input.items[0]?.children?.[0]?.id).not.toBe('pepperoni');
    expect(input.items[0]?.name).toBe('Pizza');
    expect(input.items[0]?.children?.[0]?.name).toBe('Pepperoni');
    expect(input.settings?.appearance?.segmentColors).toEqual(DEFAULT_WHEEL_SETTINGS.appearance.segmentColors);
  });

  it('retries until generated ids do not collide', () => {
    createIdMock
      .mockReturnValueOnce('taken')
      .mockReturnValueOnce('fresh-id')
      .mockReturnValueOnce('pizza-id')
      .mockReturnValueOnce('pepperoni-id');

    const input = toCreateWheelInputFromImport(document, 'Food Picker', new Set(['taken']));

    expect(input.id).toBe('fresh-id');
    expect(input.items[0]?.id).toBe('pizza-id');
    expect(input.items[0]?.children?.[0]?.id).toBe('pepperoni-id');
    expect(createIdMock).toHaveBeenCalledTimes(4);
  });
});

describe('uniqueImportedName', () => {
  it('keeps a unique name and suffixes collisions', () => {
    expect(uniqueImportedName('Food Picker', [])).toBe('Food Picker');
    expect(uniqueImportedName('Food Picker', ['Food Picker'])).toBe('Food Picker (imported)');
    expect(uniqueImportedName('Food Picker', ['Food Picker', 'Food Picker (imported)'])).toBe(
      'Food Picker (imported 2)',
    );
    expect(
      uniqueImportedName('Food Picker', [
        'Food Picker',
        'Food Picker (imported)',
        'Food Picker (imported 2)',
      ]),
    ).toBe('Food Picker (imported 3)');
  });
});

describe('collectExistingIds', () => {
  it('collects wheel and nested item ids', () => {
    const wheels = [
      {
        id: 'food',
        name: 'Food',
        items: [
          {
            id: 'pizza',
            name: 'Pizza',
            color: '#ea580c',
            enabled: true,
            weight: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            children: [
              {
                id: 'pepperoni',
                name: 'Pepperoni',
                color: '#dc2626',
                enabled: true,
                weight: 1,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ],
          },
        ],
        settings: DEFAULT_WHEEL_SETTINGS,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ] satisfies Wheel[];

    expect(collectExistingIds(wheels)).toEqual(new Set(['food', 'pizza', 'pepperoni']));
  });
});

describe('nextUniqueId', () => {
  it('adds the generated id to the taken set', () => {
    createIdMock.mockReturnValue('abc');
    const taken = new Set<string>();

    expect(nextUniqueId(taken)).toBe('abc');
    expect(taken.has('abc')).toBe(true);
  });
});
