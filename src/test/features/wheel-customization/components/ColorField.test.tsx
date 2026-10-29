import { fireEvent } from '@testing-library/react';
import { useState } from 'react';

import { ColorField } from '@/features/wheel-customization/components/ColorField';
import { CUSTOMIZATION_MESSAGES } from '@/features/wheel-customization/constants';
import { resetAppStore, useAppStore } from '@/stores/appStore';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { COLOR_MODE } from '@/types/colorMode';
import type { HexColor } from '@/types/wheel';

vi.mock('react-colorful', () => ({
  HexColorPicker({
    color,
    onChange,
    onChangeEnd,
    'aria-label': ariaLabel,
  }: {
    color?: string;
    onChange?: (value: string) => void;
    onChangeEnd?: (value: string) => void;
    'aria-label'?: string;
  }) {
    return (
      <div>
        <button type="button" aria-label={ariaLabel} onClick={() => onChange?.('#112233')}>
          {color}
        </button>
        <button type="button" onClick={() => onChangeEnd?.('#aabbcc')}>
          commit-picker
        </button>
      </div>
    );
  },
}));

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
    <>
      <ColorField
        label="Pointer color"
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
        onCommit={onCommit}
      />
      <button type="button">outside</button>
    </>
  );
}

describe('ColorField', () => {
  afterEach(() => {
    resetAppStore();
  });

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
    expect(
      screen.queryByLabelText(CUSTOMIZATION_MESSAGES.colorPicker('Pointer color')),
    ).not.toBeInTheDocument();
  });

  it('ignores non-escape keys and click-away while the picker is closed', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderWithProviders(<ControlledColorField onCommit={onCommit} />);

    await user.click(screen.getByRole('button', { name: 'Pointer color' }));
    await user.keyboard('a');
    expect(screen.getByLabelText(CUSTOMIZATION_MESSAGES.colorPicker('Pointer color'))).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(onCommit).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('commits on click-away and from the picker itself', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    renderWithProviders(<ControlledColorField onChange={onChange} onCommit={onCommit} />);

    await user.click(screen.getByRole('button', { name: 'Pointer color' }));
    await user.click(screen.getByLabelText(CUSTOMIZATION_MESSAGES.colorPicker('Pointer color')));
    expect(onChange).toHaveBeenLastCalledWith('#112233');

    await user.click(screen.getByRole('button', { name: 'commit-picker' }));
    expect(onCommit).toHaveBeenLastCalledWith('#aabbcc');

    fireEvent.mouseDown(screen.getByRole('button', { name: 'commit-picker' }));
    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(
      screen.queryByLabelText(CUSTOMIZATION_MESSAGES.colorPicker('Pointer color')),
    ).not.toBeInTheDocument();
  });

  it('applies a complete hex while typing and commits a valid hex on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    renderWithProviders(<ControlledColorField onChange={onChange} onCommit={onCommit} />);

    const hex = screen.getByRole('textbox', { name: 'Pointer color hex' });
    await user.click(hex);
    await user.clear(hex);
    await user.type(hex, '#12');
    expect(onChange).not.toHaveBeenCalled();

    await user.clear(hex);
    await user.type(hex, '#f0c');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith('#ff00cc');
    expect(onCommit).toHaveBeenCalledWith('#ff00cc');
  });

  it('does not commit an invalid hex on blur and works without onCommit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<ControlledColorField onChange={onChange} />);

    const hex = screen.getByRole('textbox', { name: 'Pointer color hex' });
    await user.click(hex);
    await user.clear(hex);
    await user.type(hex, 'not-a-color');
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Pointer color' }));
    await user.keyboard('{Escape}');
    expect(
      screen.queryByLabelText(CUSTOMIZATION_MESSAGES.colorPicker('Pointer color')),
    ).not.toBeInTheDocument();
  });

  it('uses the dark-mode swatch outline', async () => {
    useAppStore.getState().setColorMode(COLOR_MODE.dark);
    renderWithProviders(<ControlledColorField />);

    expect(screen.getByRole('button', { name: 'Pointer color' })).toBeInTheDocument();
  });
});
