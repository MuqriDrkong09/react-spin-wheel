import { useAppStore } from '@/stores/appStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWheelStore } from '@/stores/wheelStore';

import { loadPersistedState, savePersistedState, type PersistedState } from './persistedState';

export function collectPersistedState(): PersistedState {
  const { colorMode } = useAppStore.getState();
  const { wheels, activeWheelId, snapshots } = useWheelStore.getState();
  const { spinHistory } = useHistoryStore.getState();
  const { settings } = useSettingsStore.getState();
  const { favoriteWheelIds } = useFavoritesStore.getState();

  return {
    colorMode,
    wheels,
    activeWheelId,
    snapshots,
    spinHistory,
    settings,
    favoriteWheelIds,
  };
}

export function hydrateStoresFromStorage(): PersistedState {
  const state = loadPersistedState();

  useAppStore.setState({ colorMode: state.colorMode });
  useWheelStore.setState({
    wheels: state.wheels,
    activeWheelId: state.activeWheelId,
    snapshots: state.snapshots,
  });
  useHistoryStore.setState({ spinHistory: state.spinHistory });
  useSettingsStore.setState({ settings: state.settings });
  useFavoritesStore.setState({ favoriteWheelIds: state.favoriteWheelIds });

  return state;
}

export function subscribeStoresToStorage(): () => void {
  const persistNow = () => {
    savePersistedState(collectPersistedState());
  };

  const unsubscribers = [
    useAppStore.subscribe(persistNow),
    useWheelStore.subscribe(persistNow),
    useHistoryStore.subscribe(persistNow),
    useSettingsStore.subscribe(persistNow),
    useFavoritesStore.subscribe(persistNow),
  ];

  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}

export function persistStores(): boolean {
  return savePersistedState(collectPersistedState());
}

export function startStorePersistence(): () => void {
  hydrateStoresFromStorage();
  return subscribeStoresToStorage();
}
