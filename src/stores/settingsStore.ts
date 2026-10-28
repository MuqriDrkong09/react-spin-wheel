import { create } from 'zustand';

import { DEFAULT_APP_SETTINGS } from '@/constants/settings';
import { clampVolume } from '@/features/sound/soundEngine';
import type { AppSettings } from '@/types/settings';

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const initialState = {
  settings: DEFAULT_APP_SETTINGS,
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...initialState,
  updateSettings: (patch) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...patch,
        masterVolume: clampVolume(patch.masterVolume ?? state.settings.masterVolume),
      },
    })),
}));

export function resetSettingsStore(): void {
  useSettingsStore.setState({ ...initialState, settings: { ...DEFAULT_APP_SETTINGS } });
}
