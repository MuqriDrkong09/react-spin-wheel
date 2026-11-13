import { DEFAULT_WHEEL_APPEARANCE } from '@/constants/wheelAppearance';
import { COLOR_MODE } from '@/types/colorMode';
import { resetAppStore, useAppStore } from '@/stores/appStore';
import { resetFavoritesStore, useFavoritesStore } from '@/stores/favoritesStore';
import { resetGeneratorHistoryStore, useGeneratorHistoryStore } from '@/stores/generatorHistoryStore';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { resetTournamentStore, useTournamentStore } from '@/stores/tournamentStore';
import {
  resetRuntimeNoticeStore,
  useRuntimeNoticeStore,
} from '@/stores/runtimeNoticeStore';
import { resetSettingsStore, useSettingsStore } from '@/stores/settingsStore';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { SPIN_SESSION_STATUS } from '@/types/wheel';

import { generateTournament } from '@/features/random-generator/utils/generateTournament';
import { STORAGE_KEY, loadPersistedState } from '@/services/storage/persistedState';
import { storageService } from '@/services/storage/storageService';
import {
  hydrateStoresFromStorage,
  persistStores,
  startStorePersistence,
  subscribeStoresToStorage,
} from '@/services/storage/storePersistence';

function resetStores() {
  resetAppStore();
  resetWheelStore();
  resetHistoryStore();
  resetGeneratorHistoryStore();
  resetTournamentStore();
  resetSettingsStore();
  resetFavoritesStore();
  resetRuntimeNoticeStore();
}

describe('storePersistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    storageService.clearMemory();
    resetStores();
  });

  it('hydrates stores from saved data and persists later changes', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        data: {
          colorMode: COLOR_MODE.dark,
          wheels: [],
          activeWheelId: null,
          snapshots: {},
          spinHistory: [],
          settings: {
            soundEnabled: false,
            confettiEnabled: true,
            confirmBeforeDelete: true,
          },
          favoriteWheelIds: [],
        },
      }),
    );

    const stop = startStorePersistence();

    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.dark);
    expect(useSettingsStore.getState().settings.soundEnabled).toBe(false);

    useWheelStore.getState().createWheel({ id: 'pizza', name: 'Pizza' });
    useWheelStore.getState().setActiveWheel('pizza');
    useFavoritesStore.getState().addFavorite('pizza');
    useHistoryStore.getState().addSpinSession({
      id: 'session-1',
      wheelId: 'pizza',
      wheelName: 'Pizza',
      status: SPIN_SESSION_STATUS.completed,
      results: [],
      path: [],
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
    });
    useSettingsStore.getState().updateSettings({ confettiEnabled: false });
    useAppStore.getState().setColorMode(COLOR_MODE.light);

    const persisted = loadPersistedState();
    expect(persisted.wheels[0]?.name).toBe('Pizza');
    expect(persisted.activeWheelId).toBe('pizza');
    expect(persisted.favoriteWheelIds).toEqual(['pizza']);
    expect(persisted.spinHistory).toHaveLength(1);
    expect(persisted.generatorHistory).toEqual([]);
    expect(persisted.settings.confettiEnabled).toBe(false);
    expect(persisted.colorMode).toBe(COLOR_MODE.light);

    stop();
  });

  it('restores favorite wheel ids on hydrate', () => {
    useWheelStore.getState().createWheel({ id: 'pizza', name: 'Pizza' });
    useFavoritesStore.getState().addFavorite('pizza');
    persistStores();
    resetStores();

    expect(useFavoritesStore.getState().favoriteWheelIds).toEqual([]);

    const stop = startStorePersistence();
    expect(useFavoritesStore.getState().favoriteWheelIds).toEqual(['pizza']);
    stop();
  });

  it('persists generated team results separately from spin history', () => {
    useGeneratorHistoryStore.getState().addTeamGeneration({
      id: 'team-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      teamCount: 2,
      balanced: true,
      random: true,
      preventDuplicates: true,
      teams: [
        { name: 'Team A', members: ['Ahmad', 'Sarah', 'David'] },
        { name: 'Team B', members: ['Ali', 'John', 'Lisa'] },
      ],
    });
    persistStores();
    resetStores();

    expect(useGeneratorHistoryStore.getState().generatorHistory).toEqual([]);

    const stop = startStorePersistence();
    expect(useGeneratorHistoryStore.getState().generatorHistory).toHaveLength(1);
    expect(useGeneratorHistoryStore.getState().generatorHistory[0]?.teams[0]?.members).toEqual([
      'Ahmad',
      'Sarah',
      'David',
    ]);
    expect(useHistoryStore.getState().spinHistory).toEqual([]);
    stop();
  });

  it('persists tournament brackets separately from wheels and spin history', () => {
    const created = generateTournament(
      { participants: ['A', 'B'], random: false },
      0,
      {
        createBracketId: () => 't1',
        createParticipantId: (index) => `p${index}`,
        now: () => '2026-01-01T00:00:00.000Z',
      },
    );
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    useTournamentStore.getState().startTournament(created.value);
    persistStores();
    resetStores();

    expect(useTournamentStore.getState().activeTournament).toBeNull();

    const stop = startStorePersistence();
    expect(useTournamentStore.getState().activeTournament?.id).toBe('t1');
    expect(useTournamentStore.getState().tournamentHistory).toHaveLength(1);
    expect(useHistoryStore.getState().spinHistory).toEqual([]);
    expect(useWheelStore.getState().wheels).toEqual([]);
    stop();
  });

  it('reports when browser storage is unavailable on hydrate', () => {
    const availability = vi.spyOn(storageService, 'isAvailable').mockReturnValue(false);

    hydrateStoresFromStorage();

    expect(useRuntimeNoticeStore.getState().notice?.kind).toBe('storageUnavailable');
    availability.mockRestore();
  });

  it('reports when saved data is recovered on hydrate', () => {
    window.localStorage.setItem(STORAGE_KEY, '{bad');

    hydrateStoresFromStorage();

    expect(useRuntimeNoticeStore.getState().notice?.kind).toBe('storageRecovered');
  });

  it('reports when wheel hierarchy is repaired on hydrate', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        data: {
          colorMode: COLOR_MODE.system,
          wheels: [
            {
              id: 'wheel-1',
              name: 'Broken',
              items: [
                {
                  id: 'same',
                  name: 'One',
                  color: '#ef4444',
                  enabled: true,
                  weight: 1,
                  createdAt: '2026-01-01T00:00:00.000Z',
                  updatedAt: '2026-01-01T00:00:00.000Z',
                },
                {
                  id: 'same',
                  name: 'Two',
                  color: '#22c55e',
                  enabled: true,
                  weight: 2,
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
                appearance: DEFAULT_WHEEL_APPEARANCE,
              },
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          activeWheelId: null,
          snapshots: {},
          spinHistory: [],
          settings: {
            soundEnabled: true,
            confettiEnabled: true,
            confirmBeforeDelete: true,
          },
          favoriteWheelIds: [],
        },
      }),
    );

    hydrateStoresFromStorage();

    expect(useRuntimeNoticeStore.getState().notice?.kind).toBe('hierarchyRepaired');
    expect(useWheelStore.getState().wheels[0]?.items).toHaveLength(2);
    expect(useWheelStore.getState().wheels[0]?.items[0]?.id).not.toBe(
      useWheelStore.getState().wheels[0]?.items[1]?.id,
    );
  });

  it('reports save failures from persistStores when storage is available', () => {
    const writeSpy = vi.spyOn(storageService, 'writeJson').mockReturnValue(false);
    const availability = vi.spyOn(storageService, 'isAvailable').mockReturnValue(true);

    expect(persistStores()).toBe(false);
    expect(useRuntimeNoticeStore.getState().notice?.kind).toBe('storageSaveFailed');

    writeSpy.mockRestore();
    availability.mockRestore();
  });

  it('reports save failures from subscribed store updates', () => {
    const writeSpy = vi.spyOn(storageService, 'writeJson').mockReturnValue(false);
    const availability = vi.spyOn(storageService, 'isAvailable').mockReturnValue(true);
    const stop = subscribeStoresToStorage();

    useAppStore.getState().setColorMode(COLOR_MODE.dark);

    expect(useRuntimeNoticeStore.getState().notice?.kind).toBe('storageSaveFailed');

    stop();
    writeSpy.mockRestore();
    availability.mockRestore();
  });
});
