import { EXPORT_MESSAGES } from '@/features/wheel-export/constants';
import { WheelExportSnackbar } from '@/features/wheel-export/components/WheelExportSnackbar';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

describe('WheelExportSnackbar', () => {
  it('does not render an alert when there is no status', async () => {
    renderWithProviders(<WheelExportSnackbar status={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a success message and closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <WheelExportSnackbar
        status={{
          severity: 'success',
          message: EXPORT_MESSAGES.success('Food Picker', 'food-picker-wheel.json'),
        }}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      EXPORT_MESSAGES.success('Food Picker', 'food-picker-wheel.json'),
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an error message', async () => {
    renderWithProviders(
      <WheelExportSnackbar
        status={{ severity: 'error', message: EXPORT_MESSAGES.itemsRequired }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(EXPORT_MESSAGES.itemsRequired);
  });
});
