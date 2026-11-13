import { AUTO_SPIN_STATUS, SPIN_MESSAGES } from '@/features/spin/constants';
import { AutoSpinPanel } from '@/features/spin/components/AutoSpinPanel';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

function renderPanel(overrides: Partial<Parameters<typeof AutoSpinPanel>[0]> = {}) {
  const props = {
    countInput: '10',
    delayInput: '500',
    saveResults: true,
    removeWinners: false,
    status: AUTO_SPIN_STATUS.idle,
    error: null,
    results: [] as Parameters<typeof AutoSpinPanel>[0]['results'],
    total: 0,
    currentIndex: 0,
    progressPercent: 0,
    onCountChange: vi.fn(),
    onDelayChange: vi.fn(),
    onSaveResultsChange: vi.fn(),
    onRemoveWinnersChange: vi.fn(),
    onStart: vi.fn(),
    onStop: vi.fn(),
    ...overrides,
  };

  renderWithProviders(<AutoSpinPanel {...props} />);
  return props;
}

describe('AutoSpinPanel', () => {
  it('starts auto spin from the settings form', async () => {
    const user = userEvent.setup();
    const props = renderPanel();

    expect(screen.getByRole('heading', { name: SPIN_MESSAGES.autoSpinTitle })).toBeInTheDocument();
    expect(screen.getByLabelText(SPIN_MESSAGES.autoSpinCount)).toHaveValue(10);
    expect(screen.getByLabelText(SPIN_MESSAGES.autoSpinDelay)).toHaveValue(500);
    expect(screen.getByRole('switch', { name: SPIN_MESSAGES.autoSpinSaveResults })).toBeChecked();
    expect(screen.getByRole('switch', { name: SPIN_MESSAGES.autoSpinRemoveWinners })).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.autoSpinStart }));
    expect(props.onStart).toHaveBeenCalledTimes(1);
  });

  it('updates count, delay, and toggle settings while idle', async () => {
    const user = userEvent.setup();
    const props = renderPanel({ saveResults: false, removeWinners: false });

    await user.clear(screen.getByLabelText(SPIN_MESSAGES.autoSpinCount));
    await user.type(screen.getByLabelText(SPIN_MESSAGES.autoSpinCount), '5');
    expect(props.onCountChange).toHaveBeenCalled();

    await user.clear(screen.getByLabelText(SPIN_MESSAGES.autoSpinDelay));
    await user.type(screen.getByLabelText(SPIN_MESSAGES.autoSpinDelay), '250');
    expect(props.onDelayChange).toHaveBeenCalled();

    await user.click(screen.getByRole('switch', { name: SPIN_MESSAGES.autoSpinRemoveWinners }));
    expect(props.onRemoveWinnersChange).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('switch', { name: SPIN_MESSAGES.autoSpinSaveResults }));
    expect(props.onSaveResultsChange).toHaveBeenCalledWith(true);
  });

  it('disables start while busy', () => {
    renderPanel({ busy: true });

    expect(screen.getByRole('button', { name: SPIN_MESSAGES.autoSpinStart })).toBeDisabled();
  });

  it('disables conflicting settings and shows stop plus progress while running', async () => {
    const user = userEvent.setup();
    const props = renderPanel({
      status: AUTO_SPIN_STATUS.running,
      total: 10,
      currentIndex: 3,
      progressPercent: 20,
      results: [
        {
          index: 1,
          sessionId: 's-1',
          labels: ['Pizza'],
          timestamp: '2026-01-01T00:00:00.000Z',
        },
        {
          index: 2,
          sessionId: 's-2',
          labels: ['Burger'],
          timestamp: '2026-01-01T00:00:01.000Z',
        },
      ],
    });

    expect(screen.getByLabelText(SPIN_MESSAGES.autoSpinCount)).toBeDisabled();
    expect(screen.getByLabelText(SPIN_MESSAGES.autoSpinDelay)).toBeDisabled();
    expect(screen.getByRole('switch', { name: SPIN_MESSAGES.autoSpinRemoveWinners })).toBeDisabled();
    expect(screen.getByRole('switch', { name: SPIN_MESSAGES.autoSpinSaveResults })).toBeDisabled();
    expect(screen.getByText(SPIN_MESSAGES.autoSpinProgress(3, 10))).toBeInTheDocument();
    expect(screen.getByText('Spin 1 → Pizza')).toBeInTheDocument();
    expect(screen.getByText('Spin 2 → Burger')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: SPIN_MESSAGES.autoSpinTitle })).toHaveAttribute(
      'aria-valuenow',
      '20',
    );

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.autoSpinStop }));
    expect(props.onStop).toHaveBeenCalledTimes(1);
  });

  it('shows stopping state and disables stop while shutting down', () => {
    renderPanel({
      status: AUTO_SPIN_STATUS.stopping,
      total: 10,
      currentIndex: 4,
      progressPercent: 40,
    });

    const stop = screen.getByRole('button', { name: SPIN_MESSAGES.autoSpinStopping });
    expect(stop).toBeDisabled();
    expect(screen.getByText(SPIN_MESSAGES.autoSpinProgress(4, 10))).toBeInTheDocument();
  });

  it('shows completed and stopped status labels with progress', () => {
    const { rerender } = renderWithProviders(
      <AutoSpinPanel
        countInput="3"
        delayInput="0"
        saveResults
        removeWinners={false}
        status={AUTO_SPIN_STATUS.completed}
        error={null}
        results={[]}
        total={3}
        currentIndex={3}
        progressPercent={100}
        onCountChange={vi.fn()}
        onDelayChange={vi.fn()}
        onSaveResultsChange={vi.fn()}
        onRemoveWinnersChange={vi.fn()}
        onStart={vi.fn()}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByText(SPIN_MESSAGES.autoSpinComplete)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: SPIN_MESSAGES.autoSpinTitle })).toBeInTheDocument();

    rerender(
      <AutoSpinPanel
        countInput="3"
        delayInput="0"
        saveResults
        removeWinners={false}
        status={AUTO_SPIN_STATUS.stopped}
        error={null}
        results={[
          {
            index: 1,
            sessionId: 's-1',
            labels: ['Pizza'],
            timestamp: '2026-01-01T00:00:00.000Z',
          },
        ]}
        total={3}
        currentIndex={1}
        progressPercent={33}
        onCountChange={vi.fn()}
        onDelayChange={vi.fn()}
        onSaveResultsChange={vi.fn()}
        onRemoveWinnersChange={vi.fn()}
        onStart={vi.fn()}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByText(SPIN_MESSAGES.autoSpinStopped)).toBeInTheDocument();
    expect(screen.queryByText(SPIN_MESSAGES.autoSpinProgress(1, 3))).not.toBeInTheDocument();
  });

  it('hides the status label for error states and zero totals', () => {
    renderPanel({
      status: AUTO_SPIN_STATUS.error,
      total: 5,
      currentIndex: 1,
      progressPercent: 0,
      results: [
        {
          index: 1,
          sessionId: 's-1',
          labels: ['Pizza'],
          timestamp: '2026-01-01T00:00:00.000Z',
        },
      ],
      error: SPIN_MESSAGES.autoSpinFailed,
    });

    expect(screen.queryByText(/Spin \d+ of \d+/)).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(SPIN_MESSAGES.autoSpinFailed);
  });

  it('skips progress bar motion when reduced motion is preferred', () => {
    renderPanel({
      status: AUTO_SPIN_STATUS.delaying,
      total: 10,
      currentIndex: 1,
      progressPercent: 10,
      reducedMotion: true,
      results: [
        {
          index: 1,
          sessionId: 's-1',
          labels: ['Sushi'],
          timestamp: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const bar = screen.getByRole('progressbar', { name: SPIN_MESSAGES.autoSpinTitle });
    expect(bar.querySelector('.MuiLinearProgress-bar')).toHaveStyle({ transition: 'none' });
  });

  it('shows a validation error', () => {
    renderPanel({ error: SPIN_MESSAGES.autoSpinInvalidDelay });

    expect(screen.getByRole('alert')).toHaveTextContent(SPIN_MESSAGES.autoSpinInvalidDelay);
  });
});
