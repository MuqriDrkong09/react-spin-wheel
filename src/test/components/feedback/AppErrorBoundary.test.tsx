import { Button } from '@mui/material';
import { useState } from 'react';

import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { ROUTES } from '@/constants/routes';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const productionUi = vi.hoisted(() => ({ value: false }));

vi.mock('@/utils/toUserErrorMessage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/toUserErrorMessage')>();

  return {
    ...actual,
    isProductionUi: () => productionUi.value,
  };
});

function Boom({ blowUp }: { blowUp: boolean }) {
  if (blowUp) {
    throw new Error('boom-stack-should-stay-hidden-in-prod-checks');
  }

  return <p>All good</p>;
}

function Harness({ onReset }: { onReset?: () => void } = {}) {
  const [blowUp, setBlowUp] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  return (
    <AppErrorBoundary
      onReset={() => {
        setBlowUp(false);
        setResetKey((value) => value + 1);
        onReset?.();
      }}
    >
      <Button onClick={() => setBlowUp(true)}>Explode</Button>
      <Boom key={resetKey} blowUp={blowUp} />
    </AppErrorBoundary>
  );
}

describe('AppErrorBoundary', () => {
  const consoleError = console.error;
  let assignSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    productionUi.value = false;
    console.error = vi.fn();
    assignSpy = vi.fn();
    vi.stubGlobal('location', {
      ...window.location,
      assign: assignSpy,
    });
  });

  afterEach(() => {
    console.error = consoleError;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders children when nothing has thrown', () => {
    renderWithProviders(
      <AppErrorBoundary>
        <p>Healthy tree</p>
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Healthy tree')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders a friendly fallback without crashing the shell', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Explode' }));

    expect(screen.getByRole('alert')).toHaveTextContent(APP_ERROR_MESSAGES.crashTitle);
    expect(screen.getByText(APP_ERROR_MESSAGES.crashDescription)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: APP_ERROR_MESSAGES.crashTryAgain })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: APP_ERROR_MESSAGES.crashGoHome })).toBeInTheDocument();
  });

  it('logs the error and component stack outside production', async () => {
    productionUi.value = false;
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Explode' }));

    expect(console.error).toHaveBeenCalledWith(
      'AppErrorBoundary caught an error',
      expect.objectContaining({ message: 'boom-stack-should-stay-hidden-in-prod-checks' }),
      expect.any(String),
    );
  });

  it('logs only the error message in production', async () => {
    productionUi.value = true;
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Explode' }));

    expect(console.error).toHaveBeenCalledWith(
      'AppErrorBoundary caught an error',
      'boom-stack-should-stay-hidden-in-prod-checks',
    );
    expect(console.error).not.toHaveBeenCalledWith(
      'AppErrorBoundary caught an error',
      expect.any(Error),
      expect.any(String),
    );
  });

  it('resets the boundary and invokes onReset when try again is chosen', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    renderWithProviders(<Harness onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: 'Explode' }));
    await user.click(screen.getByRole('button', { name: APP_ERROR_MESSAGES.crashTryAgain }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText('All good')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('can reset without an onReset prop', async () => {
    const user = userEvent.setup();

    function SoloBoomHarness() {
      const [blowUp, setBlowUp] = useState(true);
      const [resetKey, setResetKey] = useState(0);

      return (
        <>
          <Button
            onClick={() => {
              setBlowUp(false);
              setResetKey((value) => value + 1);
            }}
          >
            Heal child
          </Button>
          <AppErrorBoundary>
            <Boom key={resetKey} blowUp={blowUp} />
          </AppErrorBoundary>
        </>
      );
    }

    renderWithProviders(<SoloBoomHarness />);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Heal child' }));
    await user.click(screen.getByRole('button', { name: APP_ERROR_MESSAGES.crashTryAgain }));

    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('clears the error and navigates home when go home is chosen', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Explode' }));
    await user.click(screen.getByRole('button', { name: APP_ERROR_MESSAGES.crashGoHome }));

    expect(assignSpy).toHaveBeenCalledWith(ROUTES.dashboard);
  });
});
