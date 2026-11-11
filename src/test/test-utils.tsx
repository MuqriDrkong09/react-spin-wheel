import { render, waitFor, type RenderOptions } from '@testing-library/react';
import userEventLib from '@testing-library/user-event';
import { Suspense, type ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router/routes';

interface AppRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

export async function renderApp(options: AppRenderOptions = {}) {
  const { initialEntries = ['/'], ...renderOptions } = options;
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
    { timeout: 10_000 },
  );

  return view;
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
