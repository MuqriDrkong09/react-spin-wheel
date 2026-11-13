import { DEFAULT_WHEEL_APPEARANCE } from '@/constants/wheelAppearance';
import { ITEM_CONDITION_KIND, SELECTION_MODE, type Wheel, type WheelItem } from '@/types/wheel';
import {
  sanitizeItemTree,
  sanitizeWheelHierarchy,
  sanitizeWheels,
} from '@/utils/sanitizeWheelHierarchy';

function item(id: string, overrides: Partial<WheelItem> = {}): WheelItem {
  return {
    id,
    name: id,
    color: '#4f46e5',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function wheel(overrides: Partial<Wheel> = {}): Wheel {
  return {
    id: 'wheel',
    name: 'Wheel',
    items: [item('pizza')],
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
    ...overrides,
  };
}

describe('sanitizeWheelHierarchy', () => {
  it('repairs duplicate ids, blank names, and invalid weights', () => {
    const result = sanitizeItemTree([
      item('dup', { weight: Number.NaN }),
      item('dup', {
        name: '  ',
        weight: -2,
        children: [item('dup'), item('', { name: '', children: [] })],
      }),
    ]);

    expect(result.repaired).toBe(true);
    expect(result.value[0]?.weight).toBe(1);
    expect(result.value[0]?.id).not.toBe(result.value[1]?.id);
    expect(result.value[1]?.name).toBe('Untitled item');
    expect(result.value[1]?.weight).toBe(1);
    expect(result.value[1]?.children?.[0]?.id).not.toBe(result.value[1]?.id);
    expect(result.value[1]?.children?.[1]?.name).toBe('Untitled item');
    expect(result.value[1]?.children?.[1]?.children).toBeUndefined();
  });

  it('leaves a healthy tree untouched', () => {
    const tree = [item('pizza', { children: [item('pepperoni')] })];
    const result = sanitizeItemTree(tree);

    expect(result.repaired).toBe(false);
    expect(result.value).toEqual(tree);
  });

  it('drops conditions that point at missing items', () => {
    const result = sanitizeWheelHierarchy(
      wheel({
        items: [item('pizza', { children: [item('pepperoni')] })],
        conditions: [
          {
            id: 'ok',
            itemId: 'pepperoni',
            kind: ITEM_CONDITION_KIND.always,
          },
          {
            id: 'bad',
            itemId: 'missing',
            kind: ITEM_CONDITION_KIND.always,
          },
        ],
      }),
    );

    expect(result.repaired).toBe(true);
    expect(result.value.conditions).toEqual([
      {
        id: 'ok',
        itemId: 'pepperoni',
        kind: ITEM_CONDITION_KIND.always,
      },
    ]);
  });

  it('keeps valid requires-selected conditions and drops dangling ones', () => {
    const result = sanitizeWheelHierarchy(
      wheel({
        items: [item('pizza'), item('burger')],
        conditions: [
          {
            id: 'req-ok',
            itemId: 'burger',
            kind: ITEM_CONDITION_KIND.requiresSelectedItem,
            requiredItemId: 'pizza',
          },
          {
            id: 'req-bad',
            itemId: 'burger',
            kind: ITEM_CONDITION_KIND.requiresSelectedItem,
            requiredItemId: 'ghost',
          },
        ],
      }),
    );

    expect(result.repaired).toBe(true);
    expect(result.value.conditions).toEqual([
      {
        id: 'req-ok',
        itemId: 'burger',
        kind: ITEM_CONDITION_KIND.requiresSelectedItem,
        requiredItemId: 'pizza',
      },
    ]);
  });

  it('repairs requires-any lists and drops invalid numeric conditions', () => {
    const result = sanitizeWheelHierarchy(
      wheel({
        items: [item('pizza'), item('burger')],
        conditions: [
          {
            id: 'any-ok',
            itemId: 'pizza',
            kind: ITEM_CONDITION_KIND.requiresAnySelectedItem,
            requiredItemIds: ['burger', 'ghost'],
          },
          {
            id: 'any-intact',
            itemId: 'burger',
            kind: ITEM_CONDITION_KIND.requiresAnySelectedItem,
            requiredItemIds: ['pizza'],
          },
          {
            id: 'any-bad',
            itemId: 'pizza',
            kind: ITEM_CONDITION_KIND.requiresAnySelectedItem,
            requiredItemIds: ['ghost'],
          },
          {
            id: 'max-ok',
            itemId: 'burger',
            kind: ITEM_CONDITION_KIND.maxWins,
            limit: 2,
          },
          {
            id: 'max-bad',
            itemId: 'burger',
            kind: ITEM_CONDITION_KIND.maxWins,
            limit: Number.NaN,
          },
          {
            id: 'max-neg',
            itemId: 'burger',
            kind: ITEM_CONDITION_KIND.maxWins,
            limit: -1,
          },
          {
            id: 'min-ok',
            itemId: 'burger',
            kind: ITEM_CONDITION_KIND.minWeight,
            minWeight: 2,
          },
          {
            id: 'min-bad',
            itemId: 'burger',
            kind: ITEM_CONDITION_KIND.minWeight,
            minWeight: Number.POSITIVE_INFINITY,
          },
          {
            id: 'min-neg',
            itemId: 'burger',
            kind: ITEM_CONDITION_KIND.minWeight,
            minWeight: -3,
          },
        ],
      }),
    );

    expect(result.repaired).toBe(true);
    expect(result.value.conditions).toEqual([
      {
        id: 'any-ok',
        itemId: 'pizza',
        kind: ITEM_CONDITION_KIND.requiresAnySelectedItem,
        requiredItemIds: ['burger'],
      },
      {
        id: 'any-intact',
        itemId: 'burger',
        kind: ITEM_CONDITION_KIND.requiresAnySelectedItem,
        requiredItemIds: ['pizza'],
      },
      {
        id: 'max-ok',
        itemId: 'burger',
        kind: ITEM_CONDITION_KIND.maxWins,
        limit: 2,
      },
      {
        id: 'min-ok',
        itemId: 'burger',
        kind: ITEM_CONDITION_KIND.minWeight,
        minWeight: 2,
      },
    ]);
  });

  it('preserves undefined conditions and empty condition lists', () => {
    expect(sanitizeWheelHierarchy(wheel({ conditions: undefined })).value.conditions).toBeUndefined();
    expect(sanitizeWheelHierarchy(wheel({ conditions: [] })).value.conditions).toEqual([]);
  });

  it('keeps a valid condition set without marking repaired', () => {
    const conditions = [
      {
        id: 'ok',
        itemId: 'pizza',
        kind: ITEM_CONDITION_KIND.always,
      },
    ];
    const result = sanitizeWheelHierarchy(wheel({ conditions }));

    expect(result.repaired).toBe(false);
    expect(result.value.conditions).toEqual(conditions);
  });

  it('clears conditions when every entry is dropped', () => {
    const result = sanitizeWheelHierarchy(
      wheel({
        conditions: [
          {
            id: 'bad',
            itemId: 'missing',
            kind: ITEM_CONDITION_KIND.always,
          },
        ],
      }),
    );

    expect(result.repaired).toBe(true);
    expect(result.value.conditions).toBeUndefined();
  });
});

describe('sanitizeWheels', () => {
  it('fills missing ids and names, and repairs nested hierarchies', () => {
    const healthy = wheel({
      id: 'healthy',
      name: 'Healthy',
      items: [item('ok')],
    });
    const broken = {
      ...wheel({ name: '', items: undefined as unknown as WheelItem[] }),
      id: '',
    } as Wheel;

    const result = sanitizeWheels([healthy, broken, wheel({ id: 'named', name: '' })]);

    expect(result.repaired).toBe(true);
    expect(result.value[0]).toEqual(healthy);
    expect(result.value[1]?.id.length).toBeGreaterThan(0);
    expect(result.value[1]?.name).toBe('Untitled wheel');
    expect(result.value[1]?.items).toEqual([]);
    expect(result.value[2]?.id).toBe('named');
    expect(result.value[2]?.name).toBe('Untitled wheel');
  });

  it('reports repair when a complete wheel needs hierarchy fixes', () => {
    const result = sanitizeWheels([
      wheel({
        items: [item('dup'), item('dup')],
      }),
    ]);

    expect(result.repaired).toBe(true);
    expect(result.value[0]?.items[0]?.id).not.toBe(result.value[0]?.items[1]?.id);
  });
});
