import { DEFAULT_WHEEL_APPEARANCE } from '@/constants/wheelAppearance';
import { ITEM_CONDITION_KIND, SELECTION_MODE, type Wheel, type WheelItem } from '@/types/wheel';
import { sanitizeItemTree, sanitizeWheelHierarchy } from '@/utils/sanitizeWheelHierarchy';

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

describe('sanitizeWheelHierarchy', () => {
  it('repairs duplicate ids and invalid weights', () => {
    const result = sanitizeItemTree([
      item('dup', { weight: Number.NaN }),
      item('dup', { name: 'Other', children: [item('dup')] }),
    ]);

    expect(result.repaired).toBe(true);
    expect(result.value[0]?.weight).toBe(1);
    expect(result.value[0]?.id).not.toBe(result.value[1]?.id);
    expect(result.value[1]?.children?.[0]?.id).not.toBe(result.value[1]?.id);
  });

  it('drops conditions that point at missing items', () => {
    const wheel: Wheel = {
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
      conditions: [
        {
          id: 'ok',
          itemId: 'pizza',
          kind: ITEM_CONDITION_KIND.always,
        },
        {
          id: 'bad',
          itemId: 'missing',
          kind: ITEM_CONDITION_KIND.always,
        },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const result = sanitizeWheelHierarchy(wheel);
    expect(result.repaired).toBe(true);
    expect(result.value.conditions).toEqual([
      {
        id: 'ok',
        itemId: 'pizza',
        kind: ITEM_CONDITION_KIND.always,
      },
    ]);
  });
});
