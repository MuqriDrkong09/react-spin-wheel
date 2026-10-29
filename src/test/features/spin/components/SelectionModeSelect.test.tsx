import { SelectionModeSelect } from '@/features/spin/components/SelectionModeSelect';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import * as wheelTypes from '@/types/wheel';
import { SELECTION_MODE } from '@/types/wheel';

function renderSelect(
  overrides: Partial<Parameters<typeof SelectionModeSelect>[0]> = {},
) {
  const props = {
    value: SELECTION_MODE.manual,
    onChange: vi.fn(),
    ...overrides,
  };

  renderWithProviders(<SelectionModeSelect {...props} />);
  return props;
}

describe('SelectionModeSelect', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the current selection mode', () => {
    renderSelect({ value: SELECTION_MODE.ask });

    expect(screen.getByRole('combobox', { name: SPIN_MESSAGES.selectionMode })).toHaveTextContent(
      SPIN_MESSAGES.selectionModeAsk,
    );
  });

  it('reports a valid mode change', async () => {
    const user = userEvent.setup();
    const { onChange } = renderSelect();

    await user.click(screen.getByRole('combobox', { name: SPIN_MESSAGES.selectionMode }));
    expect(screen.getByRole('option', { name: SPIN_MESSAGES.selectionModeManual })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: SPIN_MESSAGES.selectionModeAutomatic })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: SPIN_MESSAGES.selectionModeAsk })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: SPIN_MESSAGES.selectionModeAutomatic }));

    expect(onChange).toHaveBeenCalledWith(SELECTION_MODE.automatic);
  });

  it('ignores a value that fails the selection-mode guard', async () => {
    const user = userEvent.setup();
    vi.spyOn(wheelTypes, 'isSelectionMode').mockReturnValue(false);
    const { onChange } = renderSelect();

    await user.click(screen.getByRole('combobox', { name: SPIN_MESSAGES.selectionMode }));
    await user.click(screen.getByRole('option', { name: SPIN_MESSAGES.selectionModeAsk }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
