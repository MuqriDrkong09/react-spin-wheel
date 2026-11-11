import { AUTO_SPIN_STATUS, SPIN_MESSAGES } from '@/features/spin/constants';
import { AutoSpinPanel } from '@/features/spin/components/AutoSpinPanel';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

function renderPanel(
  overrides: Partial<Parameters<typeof AutoSpinPanel>[0]> = {},
) {
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

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.autoSpinStart }));
    expect(props.onStart).toHaveBeenCalledTimes(1);
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

  it('skips progress bar motion when reduced motion is preferred', async () => {
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

  it('shows a validation error', async () => {
    renderPanel({ error: SPIN_MESSAGES.autoSpinInvalidDelay });

    expect(screen.getByRole('alert')).toHaveTextContent(SPIN_MESSAGES.autoSpinInvalidDelay);
  });
});
