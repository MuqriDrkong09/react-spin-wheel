import { FinalResult } from '@/features/spin/components/FinalResult';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import { formatResultTimestamp } from '@/features/spin/utils/formatFinalResult';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const timestamp = '2026-10-27T01:20:00.000Z';
const steps = [
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'chicken-pepperoni', name: 'Chicken Pepperoni', icon: '🍗' },
  { id: 'large', name: 'Large', icon: '📏' },
];

describe('FinalResult', () => {
  it('shows the wheel name, icon path, timestamp, and actions', () => {
    renderWithProviders(
      <FinalResult
        wheelName="Pizza Night"
        steps={steps}
        timestamp={timestamp}
        reducedMotion
        onSpinAgain={vi.fn()}
        onStartNewSelection={vi.fn()}
        onCopy={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    const region = screen.getByRole('region', { name: SPIN_MESSAGES.finalResultTitle });
    expect(region).toHaveAccessibleDescription(/Pizza Night/);
    expect(screen.getByText('Pizza Night')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Chicken Pepperoni')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
    expect(screen.getByText('🍕')).toBeInTheDocument();
    expect(screen.getByText('🍗')).toBeInTheDocument();
    expect(screen.getByText('📏')).toBeInTheDocument();
    expect(screen.getByText(formatResultTimestamp(timestamp))).toHaveAttribute('datetime', timestamp);
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinAgain })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.startNewSelection })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.copyResult })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.saveResult })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: SPIN_MESSAGES.finalResultTitle })).toHaveFocus();
  });

  it('invokes the matching action and marks a saved result', async () => {
    const user = userEvent.setup();
    const onSpinAgain = vi.fn();
    const onStartNewSelection = vi.fn();
    const onCopy = vi.fn();
    const onSave = vi.fn();

    const { rerender } = renderWithProviders(
      <FinalResult
        wheelName="Pizza Night"
        steps={steps}
        timestamp={timestamp}
        reducedMotion
        onSpinAgain={onSpinAgain}
        onStartNewSelection={onStartNewSelection}
        onCopy={onCopy}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.copyResult }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.saveResult }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.startNewSelection }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinAgain }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onStartNewSelection).toHaveBeenCalledTimes(1);
    expect(onSpinAgain).toHaveBeenCalledTimes(1);

    rerender(
      <FinalResult
        wheelName="Pizza Night"
        steps={steps}
        timestamp={timestamp}
        reducedMotion
        saved
        statusMessage={SPIN_MESSAGES.resultSaved}
        onSpinAgain={onSpinAgain}
        onStartNewSelection={onStartNewSelection}
        onCopy={onCopy}
        onSave={onSave}
      />,
    );

    expect(screen.getByRole('button', { name: SPIN_MESSAGES.resultSaved })).toBeDisabled();
  });
});
