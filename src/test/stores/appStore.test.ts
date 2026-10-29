import { COLOR_MODE } from '@/types/colorMode';

import { resetAppStore, useAppStore } from '@/stores/appStore';

describe('useAppStore', () => {
  beforeEach(() => {
    resetAppStore();
  });

  it('defaults to system color mode and cycles light, dark, then system', () => {
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.system);

    useAppStore.getState().toggleColorMode();
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.light);

    useAppStore.getState().toggleColorMode();
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.dark);

    useAppStore.getState().toggleColorMode();
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.system);
  });

  it('sets an explicit color mode', () => {
    useAppStore.getState().setColorMode(COLOR_MODE.dark);
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.dark);
  });

  it('toggles the sidebar', () => {
    expect(useAppStore.getState().sidebarOpen).toBe(false);

    useAppStore.getState().toggleSidebar();

    expect(useAppStore.getState().sidebarOpen).toBe(true);
  });
});
