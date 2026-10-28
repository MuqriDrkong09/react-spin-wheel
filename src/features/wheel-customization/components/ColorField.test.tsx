import { useState } from 'react';

import { ColorField } from '@/features/wheel-customization/components/ColorField';
import { CUSTOMIZATION_MESSAGES } from '@/features/wheel-customization/constants';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import type { HexColor } from '@/types/wheel';

function ControlledColorField({
  initialValue = '#4f46e5',
  onChange,
  onCommit,
}: {
  initialValue?: HexColor;
  onChange?: (value: HexColor) => void;
  onCommit?: (value: HexColor) => void;
}) {
  const [value, setValue] = useState<HexColor>(initialValue);

  return (
    <ColorField
      label="Pointer color"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      onCommit={onCommit}
    />
  );
}

describe('ColorField', () => {
  it('keeps the in-app picker mounted while the color changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<ControlledColorField onChange={onChange} />);

    const swatch = screen.getByRole('button', { name: 'Pointer color' });
    await user.click(swatch);
    const picker = screen.getByLabelText(CUSTOMIZATION_MESSAGES.colorPicker('Pointer color'));

    const hex = screen.getByRole('textbox', { name: 'Pointer color hex' });
    await user.clear(hex);
    await user.type(hex, '#778899');

    expect(screen.getByLabelText(CUSTOMIZATION_MESSAGES.colorPicker('Pointer color'))).toBe(picker);
    expect(onChange).toHaveBeenLastCalledWith('#778899');
    expect(hex).toHaveValue('#778899');
    expect(screen.getByRole('button', { name: 'Pointer color' })).toBe(swatch);
  });

  it('commits when the picker closes', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderWithProviders(<ControlledColorField onCommit={onCommit} />);

    await user.click(screen.getByRole('button', { name: 'Pointer color' }));
    expect(screen.getByLabelText(CUSTOMIZATION_MESSAGES.colorPicker('Pointer color'))).toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(onCommit).toHaveBeenCalled();
  });
});
