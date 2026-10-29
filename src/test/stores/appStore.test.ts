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

    useAppStore.getState().setSidebarOpen(false);
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it('falls back to system when the color-mode cycle is empty', async () => {
    vi.resetModules();
    vi.doMock('@/types/colorMode', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/types/colorMode')>();
      return { ...actual, COLOR_MODE_CYCLE: [] };
    });

    const { useAppStore: storeWithEmptyCycle } = await import('@/stores/appStore');
    storeWithEmptyCycle.getState().toggleColorMode();

    expect(storeWithEmptyCycle.getState().colorMode).toBe(COLOR_MODE.system);
  });
});
