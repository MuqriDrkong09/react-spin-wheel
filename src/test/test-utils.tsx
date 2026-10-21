import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers';
import { appRoutes } from '@/app/router';

interface AppRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

export function renderApp(options: AppRenderOptions = {}) {
  const { initialEntries = ['/'], ...renderOptions } = options;
  const router = createMemoryRouter(appRoutes, { initialEntries });

  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
    renderOptions,
  );
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: AppProviders,
    ...options,
  });
}

export { screen, waitFor, within } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
