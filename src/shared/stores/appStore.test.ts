import { COLOR_MODE } from '@/shared/types';

import { useAppStore } from './appStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      colorMode: COLOR_MODE.light,
      sidebarOpen: false,
    });
  });

  it('toggles color mode', () => {
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.light);

    useAppStore.getState().toggleColorMode();

    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.dark);
  });

  it('toggles the sidebar', () => {
    expect(useAppStore.getState().sidebarOpen).toBe(false);

    useAppStore.getState().toggleSidebar();

    expect(useAppStore.getState().sidebarOpen).toBe(true);
  });
});
