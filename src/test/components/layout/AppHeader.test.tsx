import { AppHeader } from '@/components/layout/AppHeader';
import { APP_NAME } from '@/constants/app';
import { COLOR_MODE_MESSAGES } from '@/constants/colorMode';
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

describe('AppHeader', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    resetAppStore();
    stubViewport(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    resetAppStore();
  });

  it('renders the app name and color mode menu without a navigation button on desktop', () => {
    renderWithProviders(<AppHeader />);

    expect(screen.getByRole('banner')).toHaveClass('MuiAppBar-positionFixed');
    expect(screen.getByText(APP_NAME)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: APP_NAME })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: COLOR_MODE_MESSAGES.choose })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open navigation' })).not.toBeInTheDocument();
  });

  it('shows an open-navigation button on mobile', () => {
    stubViewport(true);
    renderWithProviders(<AppHeader />);

    expect(screen.getByRole('button', { name: 'Open navigation' })).toBeInTheDocument();
    expect(screen.getByText(APP_NAME)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COLOR_MODE_MESSAGES.choose })).toBeInTheDocument();
  });

  it('toggles the sidebar from the mobile navigation button', async () => {
    const user = userEvent.setup();
    stubViewport(true);
    renderWithProviders(<AppHeader />);

    const openNavigation = screen.getByRole('button', { name: 'Open navigation' });

    await user.click(openNavigation);
    expect(useAppStore.getState().sidebarOpen).toBe(true);

    await user.click(openNavigation);
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });
});
