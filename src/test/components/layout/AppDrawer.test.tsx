import { MemoryRouter } from 'react-router-dom';

import { AppDrawer } from '@/components/layout/AppDrawer';
import { APP_NAME, DRAWER_WIDTH } from '@/constants/app';
import { ROUTES } from '@/constants/routes';
import { NAV_ITEMS } from '@/data/navigation';
import { resetAppStore, useAppStore } from '@/stores/appStore';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

function stubViewport(isMobile: boolean) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: isMobile && query.includes('max-width'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

function renderDrawer(path = ROUTES.dashboard) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <AppDrawer />
    </MemoryRouter>,
  );
}

describe('AppDrawer', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    resetAppStore();
    stubViewport(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    resetAppStore();
  });

  it('renders a permanent drawer with the app name and nav items', () => {
    renderDrawer();

    expect(screen.getByRole('heading', { name: APP_NAME, level: 6 })).toBeInTheDocument();
    expect(document.querySelector('.MuiDrawer-docked')).toBeInTheDocument();
    expect(document.querySelector('.MuiDrawer-paper')).toHaveStyle({ width: `${DRAWER_WIDTH}px` });

    for (const item of NAV_ITEMS) {
      expect(screen.getByRole('button', { name: item.label })).toBeInTheDocument();
    }

    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveClass('Mui-selected');
    expect(screen.getByRole('button', { name: 'Settings' })).not.toHaveClass('Mui-selected');
  });

  it('marks the current route as selected', () => {
    renderDrawer(ROUTES.settings);

    expect(screen.getByRole('button', { name: 'Settings' })).toHaveClass('Mui-selected');
    expect(screen.getByRole('button', { name: 'Dashboard' })).not.toHaveClass('Mui-selected');
  });

  it('navigates without closing the sidebar on desktop', async () => {
    const user = userEvent.setup();
    useAppStore.getState().setSidebarOpen(true);
    renderDrawer();

    await user.click(screen.getByRole('button', { name: 'History' }));

    expect(screen.getByRole('button', { name: 'History' })).toHaveClass('Mui-selected');
    expect(useAppStore.getState().sidebarOpen).toBe(true);
  });

  it('keeps a closed temporary drawer mounted on mobile', () => {
    stubViewport(true);
    renderDrawer();

    expect(document.querySelector('.MuiModal-root')).toBeInTheDocument();
    expect(useAppStore.getState().sidebarOpen).toBe(false);
    expect(screen.getByText(APP_NAME)).toBeInTheDocument();
  });

  it('opens on mobile when the sidebar is open and closes after a nav click', async () => {
    const user = userEvent.setup();
    stubViewport(true);
    useAppStore.getState().setSidebarOpen(true);
    renderDrawer();

    await user.click(screen.getByRole('button', { name: 'Spin' }));

    expect(screen.getByRole('button', { name: 'Spin' })).toHaveClass('Mui-selected');
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it('closes the mobile drawer from the backdrop', async () => {
    const user = userEvent.setup();
    stubViewport(true);
    useAppStore.getState().setSidebarOpen(true);
    renderDrawer();

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();

    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);

    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });
});
