import { WinnerDialog } from '@/features/spin/components/WinnerDialog';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';
import type { WheelItem } from '@/types/wheel';

function item(name: string, extra?: Partial<WheelItem>): WheelItem {
  return {
    id: name.toLowerCase(),
    name,
    color: '#ea580c',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

describe('WinnerDialog', () => {
  it('shows Finish and Spin Again when the winner has no children', () => {
    renderWithProviders(
      <WinnerDialog
        open
        item={item('Pizza', { icon: '🍕' })}
        reducedMotion
        onClose={vi.fn()}
        onFinish={vi.fn()}
        onSpinAgain={vi.fn()}
        onSpinChild={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle });
    expect(dialog).toHaveAccessibleDescription('Pizza');
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.finish })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinAgain })).toHaveFocus();
    expect(screen.queryByText(SPIN_MESSAGES.additionalData)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPIN_MESSAGES.spinChild })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPIN_MESSAGES.close })).not.toBeInTheDocument();
  });

  it('shows additional data actions when the winner has children', () => {
    renderWithProviders(
      <WinnerDialog
        open
        item={item('Pizza', {
          children: [item('Pepperoni')],
        })}
        reducedMotion
        onClose={vi.fn()}
        onFinish={vi.fn()}
        onSpinAgain={vi.fn()}
        onSpinChild={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle })).toHaveAccessibleDescription(
      `${'Pizza'} ${SPIN_MESSAGES.additionalData}`,
    );
    expect(screen.getByText(SPIN_MESSAGES.additionalData)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinChild })).toHaveFocus();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.finish })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.close })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPIN_MESSAGES.spinAgain })).not.toBeInTheDocument();
  });

  it('invokes the matching action', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onFinish = vi.fn();
    const onSpinAgain = vi.fn();
    const onSpinChild = vi.fn();
    renderWithProviders(
      <WinnerDialog
        open
        item={item('Pizza', { children: [item('Pepperoni')] })}
        reducedMotion
        onClose={onClose}
        onFinish={onFinish}
        onSpinAgain={onSpinAgain}
        onSpinChild={onSpinChild}
      />,
    );

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinChild }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.finish }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.close }));

    expect(onSpinChild).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSpinAgain).not.toHaveBeenCalled();
  });

  it('does not render a dialog when closed', () => {
    renderWithProviders(
      <WinnerDialog
        open={false}
        item={item('Pizza')}
        onClose={vi.fn()}
        onFinish={vi.fn()}
        onSpinAgain={vi.fn()}
        onSpinChild={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lets the user continue from a grandchild that still has children', () => {
    const pizza = item('Pizza');
    const chicken = item('Chicken Pepperoni');
    const large = item('Large', { children: [item('Thin Crust')] });
    renderWithProviders(
      <WinnerDialog
        open
        item={large}
        path={[pizza, chicken, large].map((entry) => ({ id: entry.id, name: entry.name }))}
        reducedMotion
        onClose={vi.fn()}
        onFinish={vi.fn()}
        onSpinAgain={vi.fn()}
        onSpinChild={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle });
    expect(within(dialog).getByText('Pizza')).toBeInTheDocument();
    expect(within(dialog).getByText('Chicken Pepperoni')).toBeInTheDocument();
    expect(within(dialog).getByText('Large')).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription(/Pizza.*Chicken Pepperoni.*Large/s);
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinChild })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPIN_MESSAGES.spinAgain })).not.toBeInTheDocument();
  });

  it('renders the selection hierarchy for a child winner', () => {
    const pizza = item('Pizza');
    const chicken = item('Chicken Pepperoni');
    renderWithProviders(
      <WinnerDialog
        open
        item={chicken}
        path={[pizza, chicken].map((entry) => ({ id: entry.id, name: entry.name }))}
        reducedMotion
        onClose={vi.fn()}
        onFinish={vi.fn()}
        onSpinAgain={vi.fn()}
        onSpinChild={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle });
    expect(within(dialog).getByText('Pizza')).toBeInTheDocument();
    expect(within(dialog).getByText('Chicken Pepperoni')).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription(/Pizza.*Chicken Pepperoni/s);
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinAgain })).toBeInTheDocument();
  });
});
