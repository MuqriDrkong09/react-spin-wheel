import { DEFAULT_WHEEL_APPEARANCE } from '@/constants/wheelAppearance';
import { getFrozenPresetCatalog } from '@/features/presets/data/catalog';
import {
  parsePresetItemDefinition,
  parseSpinHistory,
  parseSpinResult,
  parseSpinSession,
  parseWheel,
  parseWheelItem,
  parseWheelItems,
  parseWheelPreset,
  parseWheelPresetCatalog,
  parseWheelPresetDefinition,
  parseWheelSettings,
  parseWheelSnapshot,
  parseWheels,
} from '@/schemas/parse';
import { SELECTION_MODE, SPIN_SESSION_STATUS } from '@/types/wheel';

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

const baseWheel = {
  id: 'wheel-1',
  name: 'Food',
  items: [baseItem],
  settings: baseSettings,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const baseResult = {
  id: 'r1',
  sessionId: 's1',
  wheelId: 'wheel-1',
  itemId: 'item-1',
  itemName: 'Pizza',
  parentItemId: null,
  path: ['item-1'],
  depth: 0,
  probability: 1,
  spunAt: '2026-01-01T00:00:00.000Z',
};

const baseSession = {
  id: 's1',
  wheelId: 'wheel-1',
  wheelName: 'Food',
  status: SPIN_SESSION_STATUS.completed,
  results: [baseResult],
  path: ['item-1'],
  startedAt: '2026-01-01T00:00:00.000Z',
  completedAt: '2026-01-01T00:00:01.000Z',
};

describe('schemas/parse', () => {
  it('parses wheel items and soft-falls back for invalid batches', () => {
    expect(parseWheelItem(baseItem).ok).toBe(true);
    expect(parseWheelItem({ name: 'Nope' }).ok).toBe(false);
    expect(parseWheelItems([baseItem, { id: 'bad' }])).toHaveLength(1);
    expect(parseWheelItems(null)).toEqual([]);
  });

  it('parses wheel settings with defaults on failure', () => {
    expect(parseWheelSettings(baseSettings).durationMs).toBe(4000);
    expect(parseWheelSettings({ durationMs: 'bad' }).appearance.theme).toBe(
      DEFAULT_WHEEL_APPEARANCE.theme,
    );
  });

  it('parses wheels and snapshots', () => {
    expect(parseWheel(baseWheel).ok).toBe(true);
    expect(parseWheel({ id: 'broken' }).ok).toBe(false);
    expect(parseWheels([baseWheel, { id: 'broken' }])).toHaveLength(1);
    expect(parseWheels('not-an-array')).toEqual([]);

    const snapshot = parseWheelSnapshot({
      items: [baseItem],
      settings: baseSettings,
    });
    expect(snapshot.ok).toBe(true);
    expect(parseWheelSnapshot({ items: 'bad' }).ok).toBe(false);
  });

  it('parses spin results, sessions, and history', () => {
    expect(parseSpinResult(baseResult).ok).toBe(true);
    expect(parseSpinResult({ id: 'x' }).ok).toBe(false);

    expect(parseSpinSession(baseSession).ok).toBe(true);
    expect(parseSpinSession({ id: 's1' }).ok).toBe(false);

    expect(parseSpinHistory([baseSession, { id: 'bad' }])).toHaveLength(1);
    expect(parseSpinHistory(undefined)).toEqual([]);
  });

  it('parses preset definitions, catalog entries, and saved presets', () => {
    const catalog = getFrozenPresetCatalog();
    const definition = catalog[0]!;

    expect(parsePresetItemDefinition(definition.items[0]).ok).toBe(true);
    expect(parsePresetItemDefinition({ name: '' }).ok).toBe(false);

    expect(parseWheelPresetDefinition(definition).ok).toBe(true);
    expect(parseWheelPresetDefinition({ id: 'x' }).ok).toBe(false);

    expect(parseWheelPresetCatalog(catalog)).toHaveLength(catalog.length);
    expect(parseWheelPresetCatalog([])).toEqual([]);
    expect(parseWheelPresetCatalog([{ id: 'x' }])).toEqual([]);

    const preset = parseWheelPreset({
      id: 'preset-1',
      name: 'Saved Food',
      items: [baseItem],
      settings: baseSettings,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(preset.ok).toBe(true);
    expect(parseWheelPreset({ id: 'preset-1' }).ok).toBe(false);
  });
});
