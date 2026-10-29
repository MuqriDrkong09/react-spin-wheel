import { DEFAULT_APP_SETTINGS } from '@/constants/settings';
import { DEFAULT_WHEEL_APPEARANCE } from '@/constants/wheelAppearance';
import { COLOR_MODE } from '@/types/colorMode';
import { ITEM_CONDITION_KIND, SELECTION_MODE, SPIN_SESSION_STATUS } from '@/types/wheel';

import {
  PERSISTED_STATE_VERSION,
  STORAGE_KEY,
  applyMigrations,
  clearPersistedState,
  defaultPersistedState,
  loadPersistedState,
  savePersistedState,
} from '@/services/storage/persistedState';
import { storageService } from '@/services/storage/storageService';

describe('persistedState', () => {
  beforeEach(() => {
    window.localStorage.clear();
    storageService.clearMemory();
  });

  it('returns default data when nothing is saved', () => {
    expect(loadPersistedState()).toEqual({
      ...defaultPersistedState,
      settings: DEFAULT_APP_SETTINGS,
    });
  });

  it('round-trips valid persisted state', () => {
    const saved = {
      ...defaultPersistedState,
      colorMode: COLOR_MODE.dark,
      favoriteWheelIds: ['wheel-1'],
      wheels: [
        {
          id: 'wheel-1',
          name: 'Pizza',
          items: [
            {
              id: 'chicken',
              name: 'Chicken Pepperoni',
              color: '#ef4444' as const,
              enabled: true,
              weight: 1,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          settings: {
            durationMs: 4000,
            minRotations: 4,
            maxRotations: 8,
            soundEnabled: true,
            confettiEnabled: true,
            eliminationMode: false,
            selectionMode: 'manual' as const,
            removeWinner: false,
            skipDisabledItems: true,
            appearance: DEFAULT_WHEEL_APPEARANCE,
          },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      activeWheelId: 'wheel-1',
      spinHistory: [
        {
          id: 'session-1',
          wheelId: 'wheel-1',
          wheelName: 'Pizza',
          status: SPIN_SESSION_STATUS.completed,
          results: [],
          path: ['chicken'],
          startedAt: '2026-01-01T00:00:00.000Z',
          completedAt: '2026-01-01T00:00:01.000Z',
        },
      ],
    };

    expect(savePersistedState(saved)).toBe(true);
    expect(loadPersistedState().colorMode).toBe(COLOR_MODE.dark);
    expect(loadPersistedState().wheels[0]?.name).toBe('Pizza');
    expect(loadPersistedState().spinHistory).toHaveLength(1);
  });

  it('defaults a missing selection mode to manual', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: PERSISTED_STATE_VERSION,
        data: {
          ...defaultPersistedState,
          wheels: [
            {
              id: 'wheel-1',
              name: 'Pizza',
              items: [
                {
                  id: 'chicken',
                  name: 'Chicken Pepperoni',
                  color: '#ef4444',
                  enabled: true,
                  weight: 1,
                  createdAt: '2026-01-01T00:00:00.000Z',
                  updatedAt: '2026-01-01T00:00:00.000Z',
                },
              ],
              settings: {
                durationMs: 4000,
                minRotations: 4,
                maxRotations: 8,
                soundEnabled: true,
                confettiEnabled: true,
                eliminationMode: false,
                autoSpinChildren: true,
                skipDisabledItems: true,
              },
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      }),
    );

    expect(loadPersistedState().wheels[0]?.settings.selectionMode).toBe('manual');
    expect(loadPersistedState().wheels[0]?.settings.removeWinner).toBe(false);
    expect(loadPersistedState().wheels[0]?.settings.appearance.theme).toBe('classic');
  });

  it('fills missing spin result history fields', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: PERSISTED_STATE_VERSION,
        data: {
          ...defaultPersistedState,
          spinHistory: [
            {
              id: 'session-1',
              wheelId: 'wheel-1',
              wheelName: 'Pizza',
              status: SPIN_SESSION_STATUS.completed,
              results: [
                {
                  id: 'r1',
                  sessionId: 'session-1',
                  wheelId: 'wheel-1',
                  itemId: 'large',
                  itemName: 'Large',
                  parentItemId: 'chicken',
                  path: ['pizza', 'chicken', 'large'],
                  depth: 2,
                  probability: 1,
                  spunAt: '2026-01-01T00:00:00.000Z',
                },
              ],
              path: ['pizza', 'chicken', 'large'],
              startedAt: '2026-01-01T00:00:00.000Z',
              completedAt: '2026-01-01T00:00:01.000Z',
            },
          ],
        },
      }),
    );

    const result = loadPersistedState().spinHistory[0]?.results[0];
    expect(result?.selectedItemId).toBe('large');
    expect(result?.selectedItemName).toBe('Large');
    expect(result?.pathLabels).toEqual(['Large']);
    expect(result?.timestamp).toBe('2026-01-01T00:00:00.000Z');
    expect(result?.duration).toBe(0);
    expect(result?.mode).toBe('manual');
  });

  it('returns defaults for corrupted JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{bad');
    expect(loadPersistedState()).toEqual(defaultPersistedState);
  });

  it('returns defaults for an invalid payload', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: PERSISTED_STATE_VERSION, data: { wheels: 'nope' } }),
    );
    expect(loadPersistedState()).toEqual(defaultPersistedState);
  });

  it('migrates version 0 data into the current shape', () => {
    const migrated = applyMigrations(0, { colorMode: COLOR_MODE.dark });
    const parsed = loadFromEnvelope(0, { colorMode: COLOR_MODE.dark });

    expect(migrated).toMatchObject({
      colorMode: COLOR_MODE.dark,
      wheels: [],
      settings: DEFAULT_APP_SETTINGS,
    });
    expect(parsed.colorMode).toBe(COLOR_MODE.dark);
  });

  it('drops stale active wheel and favorites after load', () => {
    savePersistedState({
      ...defaultPersistedState,
      activeWheelId: 'missing',
      favoriteWheelIds: ['missing'],
    });

    const loaded = loadPersistedState();
    expect(loaded.activeWheelId).toBeNull();
    expect(loaded.favoriteWheelIds).toEqual([]);
  });

  it('fills missing app sound settings', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: PERSISTED_STATE_VERSION,
        data: {
          ...defaultPersistedState,
          settings: {
            soundEnabled: false,
            confettiEnabled: true,
            confirmBeforeDelete: true,
          },
        },
      }),
    );

    expect(loadPersistedState().settings).toEqual({
      ...DEFAULT_APP_SETTINGS,
      soundEnabled: false,
    });
  });

  it('clears persisted state', () => {
    savePersistedState({ ...defaultPersistedState, colorMode: COLOR_MODE.dark });
    clearPersistedState();
    expect(loadPersistedState().colorMode).toBe(COLOR_MODE.system);
  });

  it('returns defaults when the envelope is not an object with version and data', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    expect(loadPersistedState()).toEqual(defaultPersistedState);
  });

  it('stops migrating when a version has no migrator', () => {
    expect(applyMigrations(-1, { colorMode: COLOR_MODE.dark })).toBeUndefined();
    expect(loadFromEnvelope(-1, { colorMode: COLOR_MODE.dark })).toEqual(defaultPersistedState);
  });

  it('fills migration gaps when the payload or settings are not objects', () => {
    expect(applyMigrations(0, null)).toMatchObject({
      ...defaultPersistedState,
      settings: DEFAULT_APP_SETTINGS,
    });
    expect(applyMigrations(0, 'nope')).toMatchObject({
      ...defaultPersistedState,
      settings: DEFAULT_APP_SETTINGS,
    });
    expect(applyMigrations(0, { settings: 'nope' })).toMatchObject({
      settings: DEFAULT_APP_SETTINGS,
    });
    expect(applyMigrations(0, { settings: { soundEnabled: false } })).toMatchObject({
      settings: { ...DEFAULT_APP_SETTINGS, soundEnabled: false },
    });
  });

  it('keeps current-version snapshots for existing wheels and drops the rest', () => {
    const wheel = {
      id: 'wheel-1',
      name: 'Pizza',
      description: 'Dinner',
      category: 'Food',
      icon: '🍕',
      items: [
        {
          id: 'pizza',
          name: 'Pizza',
          description: 'Main',
          icon: '🍕',
          color: '#ea580c' as const,
          enabled: true,
          weight: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          children: [
            {
              id: 'chicken',
              name: 'Chicken Pepperoni',
              color: '#ca8a04' as const,
              enabled: true,
              weight: 1,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      ],
      settings: {
        durationMs: 4000,
        minRotations: 4,
        maxRotations: 8,
        soundEnabled: true,
        confettiEnabled: true,
        eliminationMode: false,
        selectionMode: SELECTION_MODE.ask,
        removeWinner: true,
        skipDisabledItems: true,
        appearance: { title: 'Dinner' },
      },
      conditions: [
        { id: 'c-always', itemId: 'pizza', kind: ITEM_CONDITION_KIND.always },
        {
          id: 'c-requires',
          itemId: 'chicken',
          kind: ITEM_CONDITION_KIND.requiresSelectedItem,
          requiredItemId: 'pizza',
        },
        { id: 'c-max', itemId: 'pizza', kind: ITEM_CONDITION_KIND.maxWins, limit: 2 },
        { id: 'c-min', itemId: 'chicken', kind: ITEM_CONDITION_KIND.minWeight, minWeight: 1 },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    savePersistedState({
      ...defaultPersistedState,
      wheels: [wheel],
      activeWheelId: 'wheel-1',
      snapshots: {
        'wheel-1': {
          items: wheel.items,
          settings: {
            ...wheel.settings,
            appearance: DEFAULT_WHEEL_APPEARANCE,
          },
          conditions: wheel.conditions,
        },
        missing: {
          items: [],
          settings: {
            ...wheel.settings,
            appearance: DEFAULT_WHEEL_APPEARANCE,
          },
        },
      },
    });

    const loaded = loadPersistedState();
    expect(loaded.activeWheelId).toBe('wheel-1');
    expect(loaded.wheels[0]?.settings.appearance.title).toBe('Dinner');
    expect(loaded.wheels[0]?.items[0]?.children?.[0]?.name).toBe('Chicken Pepperoni');
    expect(loaded.wheels[0]?.conditions).toHaveLength(4);
    expect(loaded.snapshots['wheel-1']?.conditions).toHaveLength(4);
    expect(loaded.snapshots.missing).toBeUndefined();
  });

  it('keeps provided spin result fields and ignores an invalid appearance payload', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: PERSISTED_STATE_VERSION,
        data: {
          ...defaultPersistedState,
          wheels: [
            {
              id: 'wheel-1',
              name: 'Pizza',
              items: [
                {
                  id: 'chicken',
                  name: 'Chicken Pepperoni',
                  color: '#ef4444',
                  enabled: true,
                  weight: 1,
                  createdAt: '2026-01-01T00:00:00.000Z',
                  updatedAt: '2026-01-01T00:00:00.000Z',
                },
              ],
              settings: {
                durationMs: 4000,
                minRotations: 4,
                maxRotations: 8,
                soundEnabled: true,
                confettiEnabled: true,
                eliminationMode: false,
                selectionMode: SELECTION_MODE.automatic,
                removeWinner: false,
                skipDisabledItems: true,
                appearance: ['not-an-object'],
              },
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          spinHistory: [
            {
              id: 'session-1',
              wheelId: 'wheel-1',
              wheelName: 'Pizza',
              status: SPIN_SESSION_STATUS.inProgress,
              results: [
                {
                  id: 'r1',
                  sessionId: 'session-1',
                  wheelId: 'wheel-1',
                  itemId: 'chicken',
                  itemName: 'Chicken Pepperoni',
                  selectedItemId: 'chicken',
                  selectedItemName: 'Chicken Pepperoni',
                  parentItemId: null,
                  path: ['chicken'],
                  pathLabels: ['Chicken Pepperoni'],
                  depth: 0,
                  probability: 1,
                  timestamp: '2026-01-01T00:00:00.000Z',
                  spunAt: '2026-01-01T00:00:00.000Z',
                  duration: 1200,
                  mode: SELECTION_MODE.automatic,
                },
              ],
              path: ['chicken'],
              startedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      }),
    );

    const loaded = loadPersistedState();
    expect(loaded.wheels[0]?.settings.appearance.theme).toBe('classic');
    expect(loaded.spinHistory[0]?.results[0]).toMatchObject({
      selectedItemId: 'chicken',
      selectedItemName: 'Chicken Pepperoni',
      pathLabels: ['Chicken Pepperoni'],
      timestamp: '2026-01-01T00:00:00.000Z',
      duration: 1200,
      mode: SELECTION_MODE.automatic,
    });
  });
});

function loadFromEnvelope(version: number, data: unknown) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version, data }));
  return loadPersistedState();
}
