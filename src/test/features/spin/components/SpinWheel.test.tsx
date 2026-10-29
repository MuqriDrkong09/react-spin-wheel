import type { CSSProperties, ReactNode } from 'react';

import { SpinWheel } from '@/features/spin/components/SpinWheel';
import { SPIN_MESSAGES, WHEEL_HUB_COLOR, type SpinAnimationType } from '@/features/spin/constants';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { CENTER_BUTTON_STYLE, type WheelItem } from '@/types/wheel';

const motionHarness = vi.hoisted(() => ({
  fireComplete: false,
  updateRotate: undefined as number | string | undefined,
}));

vi.mock('framer-motion', async (importOriginal) => {
  const React = await import('react');
  const actual = await importOriginal<typeof import('framer-motion')>();

  function MotionDiv({
    children,
    onAnimationComplete,
    onUpdate,
    style,
    initial,
    animate,
    transition,
    ...rest
  }: {
    children?: ReactNode;
    onAnimationComplete?: () => void;
    onUpdate?: (latest: { rotate?: unknown }) => void;
    style?: CSSProperties;
    initial?: unknown;
    animate?: unknown;
    transition?: unknown;
    [key: string]: unknown;
  }) {
    React.useEffect(() => {
      if (!motionHarness.fireComplete) {
        return;
      }

      if (motionHarness.updateRotate !== undefined) {
        onUpdate?.({ rotate: motionHarness.updateRotate });
      }

      onAnimationComplete?.();
    });

    if (!motionHarness.fireComplete) {
      return React.createElement(actual.motion.div, {
        children,
        onAnimationComplete,
        onUpdate,
        style,
        initial,
        animate,
        transition,
        ...rest,
      });
    }

    return React.createElement('div', { style, ...rest }, children);
  }

  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: MotionDiv,
    },
  };
});

function item(name: string, extra?: Partial<WheelItem>): WheelItem {
  return {
    id: name.toLowerCase(),
    name,
    color: '#4f46e5',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

describe('SpinWheel', () => {
  beforeEach(() => {
    motionHarness.fireComplete = false;
    motionHarness.updateRotate = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an empty state when there are no active items', () => {
    renderWithProviders(
      <SpinWheel items={[item('Pizza', { enabled: false }), item('Burger', { weight: 0 })]} />,
    );

    expect(screen.getByRole('heading', { name: SPIN_MESSAGES.emptyTitle })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPIN_MESSAGES.spinButton })).not.toBeInTheDocument();
  });

  it('renders names, icons, colors, pointer, and a center spin button', () => {
    renderWithProviders(
      <SpinWheel
        items={[
          item('Pizza', { icon: '🍕', color: '#ea580c' }),
          item('Burger', { icon: '🍔', color: '#ca8a04', weight: 2 }),
          item('Sushi', { icon: '🍣', color: '#0f766e' }),
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: /spin wheel with pizza, burger, sushi/i })).toBeInTheDocument();
    expect(screen.getByTitle('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByTitle('🍔 Burger')).toBeInTheDocument();
    expect(screen.getByTitle('🍣 Sushi')).toBeInTheDocument();
    expect(screen.getByTitle(SPIN_MESSAGES.pointerTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toBeEnabled();
  });

  it('excludes disabled items from the wheel', () => {
    renderWithProviders(
      <SpinWheel
        items={[item('Pizza', { icon: '🍕' }), item('Burger', { icon: '🍔', enabled: false })]}
      />,
    );

    expect(screen.getByTitle('🍕 Pizza')).toBeInTheDocument();
    expect(screen.queryByTitle('🍔 Burger')).not.toBeInTheDocument();
  });

  it('clips long labels to their own slices', () => {
    const items = Array.from({ length: 11 }, (_, index) =>
      item('Cadillac F1 Team', { id: `team-${index}`, color: '#0ea5e9' }),
    );
    const { container } = renderWithProviders(<SpinWheel items={items} />);
    const visibleLabels = [...container.querySelectorAll('tspan')].map(
      (node) => node.textContent ?? '',
    );

    expect(container.querySelectorAll('clipPath')).toHaveLength(11);
    expect(visibleLabels.length).toBeGreaterThan(0);
    expect(visibleLabels.every((label) => label.length <= 12)).toBe(true);
    expect(screen.getAllByTitle('Cadillac F1 Team')).toHaveLength(11);
  });

  it('keeps the hub a static color that does not follow slice colors', () => {
    const { container, rerender } = renderWithProviders(
      <SpinWheel
        items={[item('Pizza', { icon: '🍕', color: '#ea580c' }), item('Burger', { icon: '🍔' })]}
      />,
    );
    const hub = container.querySelector('circle');

    expect(hub).toHaveAttribute('fill', WHEEL_HUB_COLOR);
    expect(hub).not.toHaveAttribute('fill', '#ea580c');
    expect(hub).not.toHaveAttribute('fill', '#4f46e5');

    rerender(
      <SpinWheel
        items={[item('Pizza', { icon: '🍕', color: '#ea580c' }), item('Burger', { icon: '🍔' })]}
        spinning
      />,
    );

    expect(container.querySelector('circle')).toHaveAttribute('fill', WHEEL_HUB_COLOR);
  });

  it('renders a single item as a full wheel', () => {
    renderWithProviders(<SpinWheel items={[item('Pizza', { icon: '🍕' })]} />);

    expect(screen.getByRole('img', { name: /spin wheel with pizza/i })).toBeInTheDocument();
    expect(screen.getByTitle('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toBeInTheDocument();
  });

  it('does not complete a spin when rotation snaps while idle', () => {
    const onSpinComplete = vi.fn();
    const { rerender } = renderWithProviders(
      <SpinWheel
        items={[item('Pizza'), item('Burger')]}
        rotationDegrees={1080}
        spinDuration={4000}
        onSpinComplete={onSpinComplete}
      />,
    );

    rerender(
      <SpinWheel
        items={[item('Pepperoni'), item('Mushroom')]}
        rotationDegrees={0}
        spinDuration={4000}
        onSpinComplete={onSpinComplete}
      />,
    );

    expect(onSpinComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toBeEnabled();
  });

  it('disables the spin button while spinning', () => {
    const onSpin = vi.fn();
    renderWithProviders(
      <SpinWheel items={[item('Pizza', { icon: '🍕' })]} spinning onSpin={onSpin} />,
    );

    const button = screen.getByRole('button', { name: SPIN_MESSAGES.spinButton });
    expect(button).toBeDisabled();
    expect(button.closest('[aria-busy="true"]')).toBeTruthy();
  });

  it('applies custom pointer, hub, and border colors from appearance', () => {
    const { container } = renderWithProviders(
      <SpinWheel
        items={[item('Pizza', { icon: '🍕' }), item('Burger', { icon: '🍔' })]}
        appearance={{
          pointerColor: '#22d3ee',
          centerButtonColor: '#082f49',
          centerButtonStyle: 'filled',
          borderColor: '#f43f5e',
          borderWidth: 3,
          segmentColors: ['#e879f9', '#a3e635'],
        }}
      />,
    );

    expect(container.querySelector('polygon')).toHaveAttribute('fill', '#22d3ee');
    expect(container.querySelector('circle')).toHaveAttribute('fill', '#082f49');
    const slice = [...container.querySelectorAll('path')].find((path) => path.getAttribute('stroke'));
    expect(slice).toHaveAttribute('stroke', '#f43f5e');
    expect(slice).toHaveAttribute('stroke-width', '3');
  });

  it('omits slice strokes when the border width is zero', () => {
    const { container } = renderWithProviders(
      <SpinWheel
        items={[item('Pizza'), item('Burger')]}
        appearance={{ borderWidth: 0, borderColor: '#f43f5e' }}
      />,
    );

    const slices = [...container.querySelectorAll('path')].filter((path) => path.getAttribute('title'));
    expect(slices.every((path) => path.getAttribute('stroke') === 'none')).toBe(true);
  });

  it('hides labels on very narrow slices', () => {
    const items = Array.from({ length: 24 }, (_, index) => item(`Item ${index}`, { id: `item-${index}` }));
    const { container } = renderWithProviders(<SpinWheel items={items} />);

    expect(container.querySelectorAll('tspan')).toHaveLength(0);
  });

  it('uses outlined and ghost center-button styles', () => {
    const { rerender } = renderWithProviders(
      <SpinWheel
        items={[item('Pizza'), item('Burger')]}
        appearance={{ centerButtonStyle: CENTER_BUTTON_STYLE.outlined }}
      />,
    );

    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toHaveClass(
      'MuiButton-outlined',
    );

    rerender(
      <SpinWheel
        items={[item('Pizza'), item('Burger')]}
        appearance={{ centerButtonStyle: CENTER_BUTTON_STYLE.ghost }}
      />,
    );

    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toHaveClass(
      'MuiButton-text',
    );
  });

  it('falls back to ease-in-out when the animation type is unknown', () => {
    renderWithProviders(
      <SpinWheel
        items={[item('Pizza'), item('Burger')]}
        animationType={'unknown' as SpinAnimationType}
      />,
    );

    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toBeEnabled();
  });

  it('starts a spin from the center button', async () => {
    const user = userEvent.setup();
    const onSpin = vi.fn();
    renderWithProviders(<SpinWheel items={[item('Pizza'), item('Burger')]} onSpin={onSpin} />);

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));

    expect(onSpin).toHaveBeenCalledTimes(1);
  });

  it('completes a reduced-motion spin and tracks rotation frames', () => {
    const onSpinComplete = vi.fn();
    motionHarness.fireComplete = true;
    motionHarness.updateRotate = 90;

    renderWithProviders(
      <SpinWheel
        items={[item('Pizza'), item('Burger')]}
        spinning
        reducedMotion
        rotationDegrees={360}
        onSpinComplete={onSpinComplete}
      />,
    );

    expect(onSpinComplete).toHaveBeenCalledTimes(1);
  });

  it('ignores non-numeric rotation updates and too-short spin completions', () => {
    const onSpinComplete = vi.fn();
    motionHarness.fireComplete = true;
    motionHarness.updateRotate = '90deg';

    renderWithProviders(
      <SpinWheel
        items={[item('Pizza'), item('Burger')]}
        spinning
        spinDuration={4000}
        rotationDegrees={1080}
        onSpinComplete={onSpinComplete}
      />,
    );

    expect(onSpinComplete).not.toHaveBeenCalled();
  });

  it('does not complete while the minimum spin duration is still running', () => {
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValue(1_000);
    const onSpinComplete = vi.fn();
    const items = [item('Pizza'), item('Burger')];
    const { rerender } = renderWithProviders(
      <SpinWheel items={items} spinning spinDuration={4000} onSpinComplete={onSpinComplete} />,
    );

    now.mockReturnValue(1_010);
    motionHarness.fireComplete = true;
    rerender(
      <SpinWheel items={items} spinning spinDuration={4000} onSpinComplete={onSpinComplete} />,
    );

    expect(onSpinComplete).not.toHaveBeenCalled();
  });

  it('completes a spin after the minimum duration has elapsed', () => {
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValue(1_000);
    const onSpinComplete = vi.fn();
    const items = [item('Pizza'), item('Burger')];
    const { rerender } = renderWithProviders(
      <SpinWheel
        items={items}
        spinning
        spinDuration={4000}
        rotationDegrees={1080}
        onSpinComplete={onSpinComplete}
      />,
    );

    now.mockReturnValue(1_200);
    motionHarness.fireComplete = true;
    motionHarness.updateRotate = 180;
    rerender(
      <SpinWheel
        items={items}
        spinning
        spinDuration={4000}
        rotationDegrees={1080}
        onSpinComplete={onSpinComplete}
      />,
    );

    expect(onSpinComplete).toHaveBeenCalledTimes(1);
  });
});

