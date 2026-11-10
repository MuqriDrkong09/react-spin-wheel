import { storageService } from '@/services/storage/storageService';
import { reportRuntimeNotice } from '@/stores/runtimeNoticeStore';
import { useAppStore } from '@/stores/appStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useGeneratorHistoryStore } from '@/stores/generatorHistoryStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTournamentStore } from '@/stores/tournamentStore';
import { useWheelStore } from '@/stores/wheelStore';

import {
  loadPersistedStateResult,
  savePersistedState,
  type PersistedState,
} from './persistedState';

export function collectPersistedState(): PersistedState {
  const { colorMode } = useAppStore.getState();
  const { wheels, activeWheelId, snapshots } = useWheelStore.getState();
  const { spinHistory } = useHistoryStore.getState();
  const { generatorHistory } = useGeneratorHistoryStore.getState();
  const { activeTournament, tournamentHistory } = useTournamentStore.getState();
  const { settings } = useSettingsStore.getState();
  const { favoriteWheelIds } = useFavoritesStore.getState();

  return {
    colorMode,
    wheels,
    activeWheelId,
    snapshots,
    spinHistory,
    generatorHistory,
    activeTournament,
    tournamentHistory,
    settings,
    favoriteWheelIds,
  };
}

export function hydrateStoresFromStorage(): PersistedState {
  const loaded = loadPersistedStateResult();
  const state = loaded.state;

  useAppStore.setState({ colorMode: state.colorMode });
  useWheelStore.setState({
    wheels: state.wheels,
    activeWheelId: state.activeWheelId,
    snapshots: state.snapshots,
  });
  useHistoryStore.setState({ spinHistory: state.spinHistory });
  useGeneratorHistoryStore.setState({ generatorHistory: state.generatorHistory });
  useTournamentStore.setState({
    activeTournament: state.activeTournament,
    tournamentHistory: state.tournamentHistory,
  });
  useSettingsStore.setState({ settings: state.settings });
  useFavoritesStore.setState({ favoriteWheelIds: state.favoriteWheelIds });

  if (!storageService.isAvailable()) {
    reportRuntimeNotice('storageUnavailable');
  } else if (loaded.status === 'recovered') {
    reportRuntimeNotice('storageRecovered');
  } else if (loaded.hierarchyRepaired) {
    reportRuntimeNotice('hierarchyRepaired');
  }

  return state;
}

export function subscribeStoresToStorage(): () => void {
  const persistNow = () => {
    const saved = savePersistedState(collectPersistedState());
    if (!saved && storageService.isAvailable()) {
      reportRuntimeNotice('storageSaveFailed');
    }
  };

  const unsubscribers = [
    useAppStore.subscribe(persistNow),
    useWheelStore.subscribe(persistNow),
    useHistoryStore.subscribe(persistNow),
    useGeneratorHistoryStore.subscribe(persistNow),
    useTournamentStore.subscribe(persistNow),
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
  const saved = savePersistedState(collectPersistedState());
  if (!saved && storageService.isAvailable()) {
    reportRuntimeNotice('storageSaveFailed');
  }
  return saved;
}

export function startStorePersistence(): () => void {
  hydrateStoresFromStorage();
  return subscribeStoresToStorage();
}
