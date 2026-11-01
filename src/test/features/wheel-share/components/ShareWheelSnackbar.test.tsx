import { SHARE_MESSAGES } from '@/features/wheel-share/constants';
import { ShareWheelSnackbar } from '@/features/wheel-share/components/ShareWheelSnackbar';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

describe('ShareWheelSnackbar', () => {
  it('does not render an alert when there is no status', () => {
    renderWithProviders(<ShareWheelSnackbar status={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a success message and closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <ShareWheelSnackbar
        status={{ severity: 'success', message: SHARE_MESSAGES.copied('Food Picker') }}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(SHARE_MESSAGES.copied('Food Picker'));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
