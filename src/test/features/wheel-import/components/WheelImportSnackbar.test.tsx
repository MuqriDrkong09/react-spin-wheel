import { IMPORT_MESSAGES } from '@/features/wheel-import/constants';
import { WheelImportSnackbar } from '@/features/wheel-import/components/WheelImportSnackbar';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

describe('WheelImportSnackbar', () => {
  it('does not render an alert when there is no status', async () => {
    renderWithProviders(<WheelImportSnackbar status={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a success message and closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <WheelImportSnackbar
        status={{ severity: 'success', message: IMPORT_MESSAGES.success('Food Picker') }}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(IMPORT_MESSAGES.success('Food Picker'));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
