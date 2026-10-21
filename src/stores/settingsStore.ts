import { create } from 'zustand';

import { DEFAULT_APP_SETTINGS } from '@/constants/settings';
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
      },
    })),
}));

export function resetSettingsStore(): void {
  useSettingsStore.setState({ ...initialState, settings: { ...DEFAULT_APP_SETTINGS } });
}
