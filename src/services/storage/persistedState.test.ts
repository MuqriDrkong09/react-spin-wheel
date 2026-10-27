import { DEFAULT_APP_SETTINGS } from '@/constants/settings';
import { COLOR_MODE } from '@/types/colorMode';
import { SPIN_SESSION_STATUS } from '@/types/wheel';

import {
  PERSISTED_STATE_VERSION,
  STORAGE_KEY,
  applyMigrations,
  clearPersistedState,
  defaultPersistedState,
  loadPersistedState,
  savePersistedState,
} from './persistedState';
import { storageService } from './storageService';

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
            selectionMode: 'manual',
            removeWinner: false,
            skipDisabledItems: true,
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

  it('clears persisted state', () => {
    savePersistedState({ ...defaultPersistedState, colorMode: COLOR_MODE.dark });
    clearPersistedState();
    expect(loadPersistedState().colorMode).toBe(COLOR_MODE.light);
  });
});

function loadFromEnvelope(version: number, data: unknown) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version, data }));
  return loadPersistedState();
}
