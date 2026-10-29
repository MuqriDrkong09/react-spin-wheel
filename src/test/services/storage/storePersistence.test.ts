import { COLOR_MODE } from '@/types/colorMode';
import { resetAppStore, useAppStore } from '@/stores/appStore';
import { resetFavoritesStore, useFavoritesStore } from '@/stores/favoritesStore';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { resetSettingsStore, useSettingsStore } from '@/stores/settingsStore';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { SPIN_SESSION_STATUS } from '@/types/wheel';

import { STORAGE_KEY, loadPersistedState } from '@/services/storage/persistedState';
import { storageService } from '@/services/storage/storageService';
import { startStorePersistence } from '@/services/storage/storePersistence';

function resetStores() {
  resetAppStore();
  resetWheelStore();
  resetHistoryStore();
  resetSettingsStore();
  resetFavoritesStore();
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
    expect(persisted.settings.confettiEnabled).toBe(false);
    expect(persisted.colorMode).toBe(COLOR_MODE.light);

    stop();
  });
});
