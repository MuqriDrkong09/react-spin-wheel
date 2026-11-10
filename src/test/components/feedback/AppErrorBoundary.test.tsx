import { Button } from '@mui/material';
import { useState } from 'react';

import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

function Boom({ blowUp }: { blowUp: boolean }) {
  if (blowUp) {
    throw new Error('boom-stack-should-stay-hidden-in-prod-checks');
  }

  return <p>All good</p>;
}

function Harness() {
  const [blowUp, setBlowUp] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  return (
    <AppErrorBoundary
      onReset={() => {
        setBlowUp(false);
        setResetKey((value) => value + 1);
      }}
    >
      <Button onClick={() => setBlowUp(true)}>Explode</Button>
      <Boom key={resetKey} blowUp={blowUp} />
    </AppErrorBoundary>
  );
}

describe('AppErrorBoundary', () => {
  const consoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = consoleError;
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

  it('resets the boundary when try again is chosen', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Explode' }));
    await user.click(screen.getByRole('button', { name: APP_ERROR_MESSAGES.crashTryAgain }));

    expect(screen.getByText('All good')).toBeInTheDocument();
  });
});
