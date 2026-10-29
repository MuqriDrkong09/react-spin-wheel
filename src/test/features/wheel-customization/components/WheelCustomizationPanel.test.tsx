import type { ComponentProps } from 'react';

import { WHEEL_THEME_LABELS } from '@/constants/wheelAppearance';
import { WheelCustomizationPanel } from '@/features/wheel-customization/components/WheelCustomizationPanel';
import { CUSTOMIZATION_MESSAGES } from '@/features/wheel-customization/constants';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { CENTER_BUTTON_STYLE, WHEEL_SIZE, WHEEL_THEME, type HexColor, type Wheel } from '@/types/wheel';

const sliderHarness = vi.hoisted(() => ({
  values: {} as Record<string, number | number[] | string>,
}));

vi.mock('@mui/material', async (importOriginal) => {
  const { createElement } = await import('react');
  const actual = await importOriginal<typeof import('@mui/material')>();

  return {
    ...actual,
    Slider: (props: ComponentProps<typeof actual.Slider>) => {
      const labelledBy = String(props['aria-labelledby'] ?? 'slider');

      return createElement(
        'button',
        {
          type: 'button',
          'aria-label': labelledBy,
          onClick: () => {
            const value = sliderHarness.values[labelledBy] ?? props.value;
            props.onChange?.({} as never, value as never, 0);
          },
        },
        labelledBy,
      );
    },
  };
});

vi.mock('@/features/wheel-customization/components/ColorField', () => ({
  ColorField({
    label,
    onChange,
    onCommit,
  }: {
    label: string;
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
      </div>
    );
  },
}));

vi.mock('@/features/wheel-customization/components/SegmentColorList', () => ({
  SegmentColorList({
    onChange,
    onCommit,
  }: {
    onChange: (colors: HexColor[]) => void;
    onCommit?: () => void;
  }) {
    return (
      <div>
        <button type="button" onClick={() => onChange(['#111111', '#22c55e'])}>
          change-segments
        </button>
        <button type="button" onClick={() => onCommit?.()}>
          commit-segments
        </button>
      </div>
    );
  },
}));

vi.mock('@/features/wheel-customization/components/WheelPreview', () => ({
  WheelPreview: () => <div data-testid="wheel-preview" />,
}));

function seedWheel(): Wheel {
  return useWheelStore.getState().createWheel({
    id: 'pizza',
    name: 'Pizza Night',
    items: [{ name: 'Pepperoni' }, { name: 'Margherita' }],
  });
}

function Panel() {
  const wheel = useWheelStore((state) => state.wheels.find((entry) => entry.id === 'pizza'));
  if (!wheel) {
    return null;
  }

  return <WheelCustomizationPanel wheel={wheel} />;
}

function appearance() {
  return useWheelStore.getState().getWheel('pizza')?.settings.appearance;
}

describe('WheelCustomizationPanel', () => {
  beforeEach(() => {
    sliderHarness.values = {};
    resetWheelStore();
    seedWheel();
  });

  it('renders customization copy and the live preview title', () => {
    renderWithProviders(<Panel />);

    expect(screen.getByRole('heading', { name: CUSTOMIZATION_MESSAGES.title, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(CUSTOMIZATION_MESSAGES.description)).toBeInTheDocument();
    expect(screen.getByText(CUSTOMIZATION_MESSAGES.preview)).toBeInTheDocument();
    expect(screen.getByText('Pizza Night')).toBeInTheDocument();
    expect(screen.getByTestId('wheel-preview')).toBeInTheDocument();
  });

  it('updates title, size, font weight, and center-button style', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Panel />);

    await user.type(screen.getByLabelText(CUSTOMIZATION_MESSAGES.wheelTitle), 'Dinner');
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(appearance()?.title).toBe('Dinner');

    await user.click(screen.getByLabelText(CUSTOMIZATION_MESSAGES.size));
    await user.click(screen.getByRole('option', { name: CUSTOMIZATION_MESSAGES.sizeLarge }));
    expect(appearance()?.size).toBe(WHEEL_SIZE.lg);

    await user.click(screen.getByLabelText(CUSTOMIZATION_MESSAGES.fontWeight));
    await user.click(screen.getByRole('option', { name: CUSTOMIZATION_MESSAGES.fontBold }));
    expect(appearance()?.fontWeight).toBe(700);

    await user.click(screen.getByLabelText(CUSTOMIZATION_MESSAGES.centerButtonStyle));
    await user.click(screen.getByRole('option', { name: CUSTOMIZATION_MESSAGES.centerGhost }));
    expect(appearance()?.centerButtonStyle).toBe(CENTER_BUTTON_STYLE.ghost);
  });

  it('applies a named theme', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Panel />);

    await user.click(
      screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.applyTheme(WHEEL_THEME_LABELS[WHEEL_THEME.neon]) }),
    );

    expect(appearance()?.theme).toBe(WHEEL_THEME.neon);
  });

  it('updates colors without persisting until commit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Panel />);

    await user.click(screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.textColor }));
    expect(appearance()?.textColor).toBe('#112233');
    await user.click(screen.getByRole('button', { name: `commit ${CUSTOMIZATION_MESSAGES.textColor}` }));

    await user.click(screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.pointerColor }));
    await user.click(screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.borderColor }));
    await user.click(screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.background }));
    await user.click(screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.centerButtonColor }));
    await user.click(screen.getByRole('button', { name: CUSTOMIZATION_MESSAGES.centerButtonTextColor }));

    expect(appearance()).toMatchObject({
      pointerColor: '#112233',
      borderColor: '#112233',
      background: '#112233',
      centerButtonColor: '#112233',
      centerButtonTextColor: '#112233',
    });

    await user.click(screen.getByRole('button', { name: 'change-segments' }));
    expect(appearance()?.segmentColors).toEqual(['#111111', '#22c55e']);
    await user.click(screen.getByRole('button', { name: 'commit-segments' }));
  });

  it('updates sliders from a number, a range, or an invalid value', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Panel />);

    sliderHarness.values['wheel-border-width-label'] = 4;
    await user.click(screen.getByRole('button', { name: 'wheel-border-width-label' }));
    expect(appearance()?.borderWidth).toBe(4);

    sliderHarness.values['wheel-font-size-label'] = [18];
    await user.click(screen.getByRole('button', { name: 'wheel-font-size-label' }));
    expect(appearance()?.fontSize).toBe(18);

    const previous = appearance();
    sliderHarness.values['wheel-border-width-label'] = [];
    await user.click(screen.getByRole('button', { name: 'wheel-border-width-label' }));
    sliderHarness.values['wheel-font-size-label'] = 'wide';
    await user.click(screen.getByRole('button', { name: 'wheel-font-size-label' }));
    expect(appearance()?.borderWidth).toBe(previous?.borderWidth);
    expect(appearance()?.fontSize).toBe(previous?.fontSize);
  });
});
