import { create } from 'zustand';

import { COLOR_MODE, COLOR_MODE_CYCLE, type ColorMode } from '@/types/colorMode';

interface AppState {
  colorMode: ColorMode;
  sidebarOpen: boolean;
  setColorMode: (colorMode: ColorMode) => void;
  toggleColorMode: () => void;
  setSidebarOpen: (sidebarOpen: boolean) => void;
  toggleSidebar: () => void;
}

const initialState = {
  colorMode: COLOR_MODE.system,
  sidebarOpen: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setColorMode: (colorMode) => set({ colorMode }),
  toggleColorMode: () =>
    set((state) => {
      const index = COLOR_MODE_CYCLE.indexOf(state.colorMode);
      const nextIndex = (index + 1) % COLOR_MODE_CYCLE.length;
      return { colorMode: COLOR_MODE_CYCLE[nextIndex] ?? COLOR_MODE.system };
    }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

export function resetAppStore(): void {
  useAppStore.setState({ ...initialState });
}
