import { SegmentColorList } from '@/features/wheel-customization/components/SegmentColorList';
import { CUSTOMIZATION_MESSAGES } from '@/features/wheel-customization/constants';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import type { HexColor } from '@/types/wheel';

vi.mock('@/features/wheel-customization/components/ColorField', () => ({
  ColorField({
    label,
    value,
    onChange,
    onCommit,
  }: {
    label: string;
    value: HexColor;
    onChange: (value: HexColor) => void;
    onCommit?: () => void;
  }) {
    return (
      <div>
        <button type="button" onClick={() => onChange('#112233')}>
          {label}
        </button>
        <button type="button" onClick={() => onCommit?.()}>
          {`commit ${label}`}
        </button>
        <span>{value}</span>
      </div>
    );
  },
}));

describe('SegmentColorList', () => {
  it('adds the default color when the list is empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<SegmentColorList colors={[]} onChange={onChange} />);

    expect(screen.getByText(CUSTOMIZATION_MESSAGES.segmentColors)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: CUSTOMIZATION_MESSAGES.removeColor(0) })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.addColor }));

    expect(onChange).toHaveBeenCalledWith(['#4f46e5']);
  });

  it('updates, duplicates, and removes colors', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    renderWithProviders(
      <SegmentColorList colors={['#ea580c', '#0f766e']} onChange={onChange} onCommit={onCommit} />,
    );

    await user.click(screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.colorN(1) }));
    expect(onChange).toHaveBeenLastCalledWith(['#ea580c', '#112233']);

    await user.click(screen.getByRole('button', { name: `commit ${CUSTOMIZATION_MESSAGES.colorN(0)}` }));
    expect(onCommit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.addColor }));
    expect(onChange).toHaveBeenLastCalledWith(['#ea580c', '#0f766e', '#0f766e']);

    await user.click(screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.removeColor(0) }));
    expect(onChange).toHaveBeenLastCalledWith(['#0f766e']);
  });

  it('disables remove when only one color remains', () => {
    renderWithProviders(<SegmentColorList colors={['#ea580c']} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.removeColor(0) })).toBeDisabled();
  });
});
