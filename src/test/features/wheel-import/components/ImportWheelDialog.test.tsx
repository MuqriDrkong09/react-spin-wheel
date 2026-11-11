import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { IMPORT_MESSAGES } from '@/features/wheel-import/constants';
import { ImportWheelDialog } from '@/features/wheel-import/components/ImportWheelDialog';
import type { WheelImportDocument } from '@/features/wheel-import/types';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const document: WheelImportDocument = {
  format: WHEEL_EXPORT_FORMAT,
  version: WHEEL_EXPORT_VERSION,
  name: 'Food Picker',
  items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
  settings: DEFAULT_WHEEL_SETTINGS,
};

describe('ImportWheelDialog', () => {
  it('does not render when there is no document', async () => {
    renderWithProviders(
      <ImportWheelDialog
        document={null}
        name=""
        nameError={null}
        onNameChange={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog', { name: 'Import wheel' })).not.toBeInTheDocument();
  });

  it('lets the user rename and confirm the import', async () => {
    const user = userEvent.setup();
    const onNameChange = vi.fn();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithProviders(
      <ImportWheelDialog
        document={document}
        name="Food Picker"
        nameError={null}
        onNameChange={onNameChange}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Import wheel' })).toBeInTheDocument();
    await user.clear(screen.getByRole('textbox', { name: 'Wheel name' }));
    expect(onNameChange).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Import wheel' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows a name error', async () => {
    renderWithProviders(
      <ImportWheelDialog
        document={document}
        name=" "
        nameError={IMPORT_MESSAGES.nameRequired}
        onNameChange={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(IMPORT_MESSAGES.nameRequired)).toBeInTheDocument();
  });

  it('closes with Escape without confirming', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    renderWithProviders(
      <ImportWheelDialog
        document={document}
        name="Food Picker"
        nameError={null}
        onNameChange={vi.fn()}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
