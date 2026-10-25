import { SpinWheel } from '@/features/spin/components/SpinWheel';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import { renderWithProviders, screen } from '@/test/test-utils';
import type { WheelItem } from '@/types/wheel';

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

  it('renders a single item as a full wheel', () => {
    renderWithProviders(<SpinWheel items={[item('Pizza', { icon: '🍕' })]} />);

    expect(screen.getByRole('img', { name: /spin wheel with pizza/i })).toBeInTheDocument();
    expect(screen.getByTitle('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toBeInTheDocument();
  });
});
