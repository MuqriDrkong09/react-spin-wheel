import { ROUTES, withWheelId } from '@/constants/routes';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderApp, screen, userEvent } from '@/test/test-utils';

function seedFoodWheel() {
  useWheelStore.getState().createWheel({
    id: 'food',
    name: 'Food Wheel',
    icon: '📁',
    settings: { durationMs: 60_000, minRotations: 4, maxRotations: 4 },
    items: [
      { id: 'pizza', name: 'Pizza', icon: '🍕', color: '#ea580c', enabled: true, weight: 1 },
      { id: 'burger', name: 'Burger', icon: '🍔', color: '#ca8a04', enabled: true, weight: 2 },
      { id: 'sushi', name: 'Sushi', icon: '🍣', color: '#0f766e', enabled: true, weight: 1 },
      { id: 'salad', name: 'Salad', icon: '🥗', color: '#16a34a', enabled: false, weight: 1 },
    ],
  });
  useWheelStore.getState().setActiveWheel('food');
}

function stubReducedMotion(matches: boolean) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

describe('SpinScreen', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    resetWheelStore();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('shows an empty state when no wheel is selected', () => {
    renderApp({ initialEntries: [ROUTES.spin] });

    expect(screen.getByRole('heading', { name: 'Spin', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: SPIN_MESSAGES.noWheelTitle })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a wheel' })).toBeInTheDocument();
  });

  it('asks which wheel to spin when opened without a wheel id', () => {
    seedFoodWheel();
    useWheelStore.getState().createWheel({ id: 'games', name: 'Games Wheel', category: 'Games' });
    renderApp({ initialEntries: [ROUTES.spin] });

    expect(screen.getByText(SPIN_MESSAGES.chooseWheelDescription)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.chooseWheelAction('Food Wheel') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.chooseWheelAction('Games Wheel') })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPIN_MESSAGES.spinButton })).not.toBeInTheDocument();
  });

  it('opens the chosen wheel from the picker instead of the active wheel', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    useWheelStore.getState().createWheel({
      id: 'games',
      name: 'Games Wheel',
      items: [{ id: 'chess', name: 'Chess', color: '#2563eb', enabled: true, weight: 1 }],
    });
    useWheelStore.getState().setActiveWheel('food');
    renderApp({ initialEntries: [ROUTES.spin] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.chooseWheelAction('Games Wheel') }));

    expect(screen.getByText('Spin Games Wheel.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /spin wheel with chess/i })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /pizza, burger, sushi/i })).not.toBeInTheDocument();
  });

  it('returns to the wheel picker from an open spin', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.changeWheel }));

    expect(screen.getByText(SPIN_MESSAGES.chooseWheelDescription)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.chooseWheelAction('Food Wheel') })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPIN_MESSAGES.spinButton })).not.toBeInTheDocument();
  });

  it('shows the picker from the sidebar even when a wheel is already active', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderApp({ initialEntries: [ROUTES.dashboard] });

    await user.click(screen.getByRole('button', { name: 'Spin' }));

    expect(screen.getByText(SPIN_MESSAGES.chooseWheelDescription)).toBeInTheDocument();
    expect(screen.queryByText('Spin Food Wheel.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPIN_MESSAGES.spinButton })).not.toBeInTheDocument();
  });

  it('renders the visual wheel for a requested wheel', () => {
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    expect(screen.getByText('Spin Food Wheel.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /spin wheel with pizza, burger, sushi/i })).toBeInTheDocument();
    expect(screen.getByTitle('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByTitle('🍔 Burger')).toBeInTheDocument();
    expect(screen.queryByTitle(/salad/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toBeInTheDocument();
    expect(screen.getByTitle(SPIN_MESSAGES.pointerTitle)).toBeInTheDocument();
  });

  it('disables spin and stays spinning until the animation completes', async () => {
    const user = userEvent.setup();
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    const button = screen.getByRole('button', { name: SPIN_MESSAGES.spinButton });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText(SPIN_MESSAGES.spinning)).toBeInTheDocument();
    expect(screen.queryByText(/wins!/)).not.toBeInTheDocument();
    expect(random).toHaveBeenCalledTimes(1);
  });

  it('lands on a winner immediately when reduced motion is preferred', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));

    const button = screen.getByRole('button', { name: SPIN_MESSAGES.spinButton });
    expect(screen.getByText(SPIN_MESSAGES.winner('Burger'))).toBeInTheDocument();
    expect(button).toBeEnabled();

    await user.click(button);
    expect(screen.getByText(SPIN_MESSAGES.winner('Burger'))).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('handles a wheel with a single active item', () => {
    useWheelStore.getState().createWheel({
      id: 'solo',
      name: 'Solo',
      items: [{ id: 'yes', name: 'Yes', color: '#16a34a', enabled: true, weight: 1 }],
    });

    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'solo')] });

    expect(screen.getByRole('img', { name: /spin wheel with yes/i })).toBeInTheDocument();
    expect(screen.getByTitle('Yes')).toBeInTheDocument();
  });
});
