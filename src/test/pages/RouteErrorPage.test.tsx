import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { ROUTES } from '@/constants/routes';
import { describeRouteError, RouteErrorPage } from '@/pages/RouteErrorPage';
import { screen, userEvent } from '@/test/test-utils';

const productionUi = vi.hoisted(() => ({ value: false }));
const routeError = vi.hoisted(() => ({ current: new Error('boom') as unknown }));
const navigate = vi.hoisted(() => vi.fn());

vi.mock('@/utils/toUserErrorMessage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/toUserErrorMessage')>();

  return {
    ...actual,
    isProductionUi: () => productionUi.value,
  };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();

  return {
    ...actual,
    useNavigate: () => navigate,
    useRouteError: () => routeError.current,
  };
});

function routeErrorResponse(status: number, statusText: string) {
  return { status, statusText, internal: true as const, data: 'error' };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <RouteErrorPage />
    </MemoryRouter>,
  );
}

describe('RouteErrorPage', () => {
  beforeEach(() => {
    productionUi.value = false;
    routeError.current = new Error('boom');
    navigate.mockReset();
  });

  it('renders a route response with status text and hides detail in production', () => {
    productionUi.value = true;
    routeError.current = routeErrorResponse(404, 'Not Found');
    renderPage();

    expect(screen.getByRole('heading', { name: '404 Not Found', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(APP_ERROR_MESSAGES.routeDescription)).toBeInTheDocument();
    expect(screen.getByRole('alert').querySelector('pre')).not.toBeInTheDocument();
  });

  it('falls back to the route title when status text is empty', () => {
    routeError.current = routeErrorResponse(500, '');
    renderPage();

    expect(
      screen.getByRole('heading', {
        name: `500 ${APP_ERROR_MESSAGES.routeTitle}`,
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(APP_ERROR_MESSAGES.routeDescription)).toBeInTheDocument();
  });

  it('renders a non-route crash with detail outside production', () => {
    routeError.current = new Error('loader exploded');
    renderPage();

    expect(
      screen.getByRole('heading', { name: APP_ERROR_MESSAGES.routeTitle, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(APP_ERROR_MESSAGES.crashDescription)).toBeInTheDocument();
    expect(screen.getByText('loader exploded')).toBeInTheDocument();
  });

  it('retries the failed route and navigates home', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: APP_ERROR_MESSAGES.crashTryAgain }));
    expect(navigate).toHaveBeenCalledWith(0);

    await user.click(screen.getByRole('button', { name: APP_ERROR_MESSAGES.crashGoHome }));
    expect(navigate).toHaveBeenCalledWith(ROUTES.dashboard, { replace: true });
  });
});

describe('describeRouteError', () => {
  it('summarizes route responses and unknown errors safely', () => {
    expect(describeRouteError(routeErrorResponse(404, 'Not Found'))).toBe('404: Not Found');
    expect(describeRouteError(routeErrorResponse(503, ''))).toBe('503: Route error');
    expect(describeRouteError(new Error('boom'))).toBe('boom');
    expect(describeRouteError({})).toBe(APP_ERROR_MESSAGES.routeDescription);
  });
});
