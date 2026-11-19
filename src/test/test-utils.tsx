import { render, waitFor, type RenderOptions } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import { Suspense, type ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router/routes';
import { ROUTES } from '@/constants/routes';

interface AppRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

/** Warm the same page modules React.lazy will request so Suspense resolves under a full suite. */
const ROUTE_PAGE_LOADERS: Record<string, () => Promise<unknown>> = {
  [ROUTES.dashboard]: () => import('@/pages/DashboardPage'),
  [ROUTES.wheels]: () => import('@/pages/WheelsPage'),
  [ROUTES.createWheel]: () => import('@/pages/CreateWheelPage'),
  [ROUTES.wheelEditor]: () => import('@/pages/WheelEditorPage'),
  [ROUTES.spin]: () => import('@/pages/SpinPage'),
  [ROUTES.history]: () => import('@/pages/HistoryPage'),
  [ROUTES.statistics]: () => import('@/pages/StatisticsPage'),
  [ROUTES.presets]: () => import('@/pages/PresetsPage'),
  [ROUTES.settings]: () => import('@/pages/SettingsPage'),
  [ROUTES.randomGenerator]: () => import('@/pages/RandomGeneratorPage'),
  [ROUTES.testDataGenerator]: () => import('@/pages/TestDataGeneratorPage'),
  [ROUTES.sharedWheel]: () => import('@/pages/SharedWheelPage'),
};

function routePathFromEntry(entry: string): string {
  const path = entry.split('?')[0] || '/';
  if (path.startsWith(`${ROUTES.sharedWheel}/`)) {
    return ROUTES.sharedWheel;
  }
  return path;
}

async function preloadInitialRoute(entry: string): Promise<void> {
  const loader = ROUTE_PAGE_LOADERS[routePathFromEntry(entry)];
  if (loader) {
    await loader();
  }
}

export async function renderApp(options: AppRenderOptions = {}) {
  const { initialEntries = ['/'], ...renderOptions } = options;
  await preloadInitialRoute(initialEntries[0] ?? '/');

  const router = createMemoryRouter(appRoutes, { initialEntries });

  const view = render(
    <AppProviders>
      <Suspense fallback={<div data-testid="route-loading">Loading page…</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>,
    renderOptions,
  );

  await waitFor(
    () => {
      expect(view.queryByTestId('route-loading')).not.toBeInTheDocument();
    },
    // Lazy chunks can still stall briefly under a large parallel suite on slower disks.
    { timeout: 20_000 },
  );

  return { ...view, router };
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: AppProviders,
    ...options,
  });
}

export { screen, waitFor, within } from '@testing-library/react';

const setupUser = userEventLib.setup.bind(userEventLib);

export const userEvent = Object.assign({}, userEventLib, {
  setup: (options?: Parameters<typeof userEventLib.setup>[0]) =>
    setupUser({ delay: null, ...options }),
});
