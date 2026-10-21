import { create } from 'zustand';

import { COLOR_MODE, type ColorMode } from '@/types/colorMode';

interface AppState {
  colorMode: ColorMode;
  sidebarOpen: boolean;
  setColorMode: (colorMode: ColorMode) => void;
  toggleColorMode: () => void;
  setSidebarOpen: (sidebarOpen: boolean) => void;
  toggleSidebar: () => void;
}

const initialState = {
  colorMode: COLOR_MODE.light,
  sidebarOpen: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setColorMode: (colorMode) => set({ colorMode }),
  toggleColorMode: () =>
    set((state) => ({
      colorMode: state.colorMode === COLOR_MODE.light ? COLOR_MODE.dark : COLOR_MODE.light,
    })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

export function resetAppStore(): void {
  useAppStore.setState({ ...initialState });
}
