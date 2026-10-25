import { ROUTES, withWheelId } from '@/constants/routes';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderApp, screen } from '@/test/test-utils';

function seedFoodWheel() {
  useWheelStore.getState().createWheel({
    id: 'food',
    name: 'Food Wheel',
    icon: '📁',
    items: [
      { id: 'pizza', name: 'Pizza', icon: '🍕', color: '#ea580c', enabled: true, weight: 1 },
      { id: 'burger', name: 'Burger', icon: '🍔', color: '#ca8a04', enabled: true, weight: 2 },
      { id: 'sushi', name: 'Sushi', icon: '🍣', color: '#0f766e', enabled: true, weight: 1 },
      { id: 'salad', name: 'Salad', icon: '🥗', color: '#16a34a', enabled: false, weight: 1 },
    ],
  });
  useWheelStore.getState().setActiveWheel('food');
}

describe('SpinScreen', () => {
  beforeEach(() => {
    resetWheelStore();
  });

  it('shows an empty state when no wheel is selected', () => {
    renderApp({ initialEntries: [ROUTES.spin] });

    expect(screen.getByRole('heading', { name: 'Spin', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: SPIN_MESSAGES.noWheelTitle })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a wheel' })).toBeInTheDocument();
  });

  it('renders the visual wheel from the active wheel items', () => {
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
