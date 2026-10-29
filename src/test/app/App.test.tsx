import { render } from '@testing-library/react';

import { App } from '@/app/App';
import { ROUTES } from '@/constants/routes';
import { NAV_ITEMS } from '@/data/navigation';
import { SETTINGS_MESSAGES } from '@/features/settings/constants';
import { PRESET_MESSAGES } from '@/features/presets/constants';
import { HISTORY_MESSAGES } from '@/features/history/constants';
import { STATISTICS_MESSAGES } from '@/features/statistics/constants';
import { renderApp, screen, userEvent } from '@/test/test-utils';

const APP_PAGES = [
  { path: ROUTES.dashboard, heading: 'Dashboard' },
  { path: ROUTES.wheels, heading: 'Wheels' },
  { path: ROUTES.createWheel, heading: 'Create wheel' },
  { path: ROUTES.wheelEditor, heading: 'Wheel editor' },
  { path: ROUTES.spin, heading: 'Spin' },
  { path: ROUTES.history, heading: HISTORY_MESSAGES.title },
  { path: ROUTES.statistics, heading: STATISTICS_MESSAGES.title },
  { path: ROUTES.presets, heading: PRESET_MESSAGES.title },
  { path: ROUTES.settings, heading: SETTINGS_MESSAGES.title },
  { path: ROUTES.randomGenerator, heading: 'Random generator' },
] as const;

describe('App', () => {
  it('renders providers and the router from App', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    for (const item of NAV_ITEMS) {
      expect(screen.getByRole('button', { name: item.label })).toBeInTheDocument();
    }
  });

  it.each(APP_PAGES)('renders $heading at $path', ({ path, heading }) => {
    renderApp({ initialEntries: [path] });

    expect(screen.getByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
  });

  it('renders the not found page and returns to the dashboard', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: ['/missing-page'] });

    expect(screen.getByRole('heading', { name: /page not found/i, level: 1 })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }));

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
  });
});
