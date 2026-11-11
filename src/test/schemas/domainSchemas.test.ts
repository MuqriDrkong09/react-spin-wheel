import { DEFAULT_WHEEL_APPEARANCE } from '@/constants/wheelAppearance';
import { getFrozenPresetCatalog } from '@/features/presets/data/catalog';
import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { WHEEL_SHARE_FORMAT, WHEEL_SHARE_VERSION } from '@/features/wheel-share/constants';
import {
  itemConditionSchema,
  parseShareWheel,
  parseSpinResult,
  parseWheel,
  parseWheelItem,
  parseWheelItems,
  parseWheelPresetCatalog,
  parseWheelSettings,
  parseWheels,
  spinResultSchema,
  wheelImportDocumentSchema,
  wheelItemSchema,
  wheelSchema,
  wheelSettingsSchema,
  wheelShareEnvelopeSchema,
} from '@/schemas';
import { ITEM_CONDITION_KIND, SELECTION_MODE } from '@/types/wheel';

const baseItem = {
  id: 'item-1',
  name: 'Pizza',
  color: '#ef4444',
  enabled: true,
  weight: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const baseSettings = {
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
};

describe('domain Zod schemas', () => {
  it('validates recursive WheelItem trees', () => {
    const nested = {
      ...baseItem,
      children: [
        {
          ...baseItem,
          id: 'child-1',
          name: 'Chicken',
          children: [{ ...baseItem, id: 'grandchild-1', name: 'Spicy' }],
        },
      ],
    };

    expect(wheelItemSchema.safeParse(nested).success).toBe(true);
    const coerced = parseWheelItem({ ...baseItem, weight: Number.NaN });
    expect(coerced.ok).toBe(true);
    if (coerced.ok) {
      expect(coerced.data.weight).toBe(1);
    }
  });

  it('rejects WheelItem without required fields', () => {
    expect(parseWheelItem({ name: 'Nope' }).ok).toBe(false);
  });

  it('falls back WheelSettings to defaults when invalid', () => {
    const settings = parseWheelSettings({ durationMs: 'bad' });
    expect(settings.durationMs).toBe(4000);
    expect(settings.selectionMode).toBe(SELECTION_MODE.manual);
    expect(settings.appearance.theme).toBe(DEFAULT_WHEEL_APPEARANCE.theme);
  });

  it('defaults missing selectionMode on persisted WheelSettings', () => {
    const { selectionMode: _omit, ...withoutMode } = baseSettings;
    const parsed = wheelSettingsSchema.safeParse(withoutMode);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.selectionMode).toBe(SELECTION_MODE.manual);
    }
  });

  it('validates Wheel and drops invalid wheels in soft parse', () => {
    const wheel = {
      id: 'wheel-1',
      name: 'Food',
      items: [baseItem],
      settings: baseSettings,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    expect(wheelSchema.safeParse(wheel).success).toBe(true);
    expect(parseWheel(wheel).ok).toBe(true);
    expect(parseWheels([wheel, { id: 'broken' }, null])).toHaveLength(1);
  });

  it('persists serializable item conditions and soft-drops invalid ones', () => {
    const conditions = [
      { id: 'c1', itemId: 'item-1', kind: ITEM_CONDITION_KIND.always },
      {
        id: 'c2',
        itemId: 'item-1',
        kind: ITEM_CONDITION_KIND.requiresSelectedItem,
        requiredItemId: 'parent-1',
      },
      {
        id: 'c3',
        itemId: 'item-1',
        kind: ITEM_CONDITION_KIND.requiresAnySelectedItem,
        requiredItemIds: ['a', 'b'],
      },
      { id: 'c4', itemId: 'item-1', kind: ITEM_CONDITION_KIND.maxWins, limit: 2 },
      { id: 'c5', itemId: 'item-1', kind: ITEM_CONDITION_KIND.minWeight, minWeight: 1 },
      { id: 'bad', itemId: 'item-1', kind: 'unknown_kind' },
      { id: 'bad-max', itemId: 'item-1', kind: ITEM_CONDITION_KIND.maxWins, limit: -1 },
    ];

    for (const condition of conditions.slice(0, 5)) {
      expect(itemConditionSchema.safeParse(condition).success).toBe(true);
    }
    expect(itemConditionSchema.safeParse(conditions[5]).success).toBe(false);
    expect(itemConditionSchema.safeParse(conditions[6]).success).toBe(false);

    const wheel = {
      id: 'wheel-1',
      name: 'Food',
      items: [baseItem],
      settings: baseSettings,
      conditions,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const parsed = wheelSchema.safeParse(wheel);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.conditions).toHaveLength(5);
    }
  });

  it('normalizes legacy SpinResult fields', () => {
    const legacy = {
      id: 'r1',
      sessionId: 's1',
      wheelId: 'w1',
      itemId: 'i1',
      itemName: 'Pizza',
      parentItemId: null,
      path: ['i1'],
      depth: 0,
      probability: 1,
      spunAt: '2026-01-01T00:00:00.000Z',
    };

    const parsed = spinResultSchema.safeParse(legacy);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.selectedItemId).toBe('i1');
      expect(parsed.data.selectedItemName).toBe('Pizza');
      expect(parsed.data.pathLabels).toEqual(['Pizza']);
      expect(parsed.data.timestamp).toBe(legacy.spunAt);
      expect(parsed.data.duration).toBe(0);
      expect(parsed.data.mode).toBe(SELECTION_MODE.manual);
    }

    expect(parseSpinResult({ id: 'x' }).ok).toBe(false);
  });

  it('validates the built-in preset catalog', () => {
    const catalog = getFrozenPresetCatalog();
    expect(catalog.length).toBeGreaterThan(0);
    expect(parseWheelPresetCatalog(catalog)).toHaveLength(catalog.length);
    expect(parseWheelPresetCatalog([{ id: 'x' }])).toEqual([]);
  });

  it('validates imported JSON documents', () => {
    const document = {
      format: WHEEL_EXPORT_FORMAT,
      version: WHEEL_EXPORT_VERSION,
      name: 'Food',
      items: [
        {
          name: 'Pizza',
          color: '#ef4444',
          enabled: true,
          weight: 1,
          children: [{ name: 'Chicken', color: '#22c55e', enabled: true, weight: 1 }],
        },
      ],
      settings: baseSettings,
    };

    expect(wheelImportDocumentSchema.safeParse(document).success).toBe(true);
    expect(wheelImportDocumentSchema.safeParse({ name: 'Food' }).success).toBe(false);
  });

  it('validates shared wheel envelopes and payload', () => {
    const wheel = {
      name: 'Shared',
      items: [{ name: 'A', color: '#ef4444', enabled: true, weight: 1 }],
      settings: baseSettings,
    };

    const envelope = {
      format: WHEEL_SHARE_FORMAT,
      version: WHEEL_SHARE_VERSION,
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-02T00:00:00.000Z',
      wheel,
    };

    expect(wheelShareEnvelopeSchema.safeParse(envelope).success).toBe(true);
    expect(parseShareWheel(wheel).ok).toBe(true);
    expect(parseShareWheel({ name: 'nope' }).ok).toBe(false);
  });

  it('soft-parses nested item lists', () => {
    expect(
      parseWheelItems([
        baseItem,
        { id: 'bad' },
        {
          ...baseItem,
          id: 'nested',
          children: [{ ...baseItem, id: 'ok-child' }, { name: 'bad-child' }],
        },
      ]),
    ).toHaveLength(2);
  });
});
