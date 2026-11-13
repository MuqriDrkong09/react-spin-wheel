import { GlobalErrorFallback } from '@/components/feedback/GlobalErrorFallback';
import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const productionUi = vi.hoisted(() => ({ value: false }));

vi.mock('@/utils/toUserErrorMessage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/toUserErrorMessage')>();

  return {
    ...actual,
    isProductionUi: () => productionUi.value,
  };
});

describe('GlobalErrorFallback', () => {
  beforeEach(() => {
    productionUi.value = false;
  });

  it('renders the default crash title and description', () => {
    renderWithProviders(<GlobalErrorFallback />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: APP_ERROR_MESSAGES.crashTitle, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(APP_ERROR_MESSAGES.crashDescription)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    renderWithProviders(
      <GlobalErrorFallback title="Route failed" description="This page could not load." />,
    );

    expect(screen.getByRole('heading', { name: 'Route failed', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('This page could not load.')).toBeInTheDocument();
    expect(screen.queryByText(APP_ERROR_MESSAGES.crashTitle)).not.toBeInTheDocument();
  });

  it('shows a safe error detail outside production when an error is provided', () => {
    productionUi.value = false;
    renderWithProviders(<GlobalErrorFallback error={new Error('  Disk full  ')} />);

    expect(screen.getByText('Disk full')).toBeInTheDocument();
  });

  it('hides error detail in production even when an error is provided', () => {
    productionUi.value = true;
    renderWithProviders(<GlobalErrorFallback error={new Error('secret stack detail')} />);

    expect(screen.queryByText('secret stack detail')).not.toBeInTheDocument();
    expect(screen.getByText(APP_ERROR_MESSAGES.crashDescription)).toBeInTheDocument();
  });

  it('hides error detail when no error is provided', () => {
    productionUi.value = false;
    renderWithProviders(<GlobalErrorFallback />);

    expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('alert').querySelector('pre')).not.toBeInTheDocument();
  });

  it('renders and invokes the reset action with the default label', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    renderWithProviders(<GlobalErrorFallback onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: APP_ERROR_MESSAGES.crashTryAgain }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders and invokes the home action with a custom label', async () => {
    const user = userEvent.setup();
    const onGoHome = vi.fn();
    renderWithProviders(<GlobalErrorFallback onGoHome={onGoHome} homeLabel="Return home" />);

    await user.click(screen.getByRole('button', { name: 'Return home' }));

    expect(onGoHome).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: APP_ERROR_MESSAGES.crashTryAgain })).not.toBeInTheDocument();
  });

  it('renders both actions with custom labels when provided', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    const onGoHome = vi.fn();

    renderWithProviders(
      <GlobalErrorFallback
        onReset={onReset}
        onGoHome={onGoHome}
        resetLabel="Retry now"
        homeLabel="Dashboard"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Retry now' }));
    await user.click(screen.getByRole('button', { name: 'Dashboard' }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
