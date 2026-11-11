import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { FavoriteWheelsCard } from '@/features/dashboard/components/FavoriteWheelsCard';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import type { Wheel } from '@/types/wheel';

function createWheel(overrides: Partial<Wheel> & Pick<Wheel, 'id' | 'name'>): Wheel {
  return {
    description: undefined,
    category: 'Food',
    items: [],
    settings: DEFAULT_WHEEL_SETTINGS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const pizza = createWheel({ id: 'pizza', name: 'Pizza Night', category: 'Food' });
const chores = createWheel({ id: 'chores', name: 'Chores', category: 'Decisions' });

describe('FavoriteWheelsCard', () => {
  it('shows an empty state when there are no favorite wheels', async () => {
    renderWithProviders(
      <FavoriteWheelsCard wheels={[]} onOpen={vi.fn()} onToggleFavorite={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { name: 'Favorite wheels', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('No favorite wheels yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('lists favorite wheels with accessible star buttons', async () => {
    renderWithProviders(
      <FavoriteWheelsCard wheels={[pizza, chores]} onOpen={vi.fn()} onToggleFavorite={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Open favorite Pizza Night' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Pizza Night from favorites' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Open favorite Chores' })).toBeInTheDocument();
    expect(screen.getAllByTestId('StarIcon')).toHaveLength(2);
    expect(screen.queryByText('No favorite wheels yet.')).not.toBeInTheDocument();
  });

  it('opens a favorite wheel without toggling the star', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onToggleFavorite = vi.fn();
    renderWithProviders(
      <FavoriteWheelsCard wheels={[pizza]} onOpen={onOpen} onToggleFavorite={onToggleFavorite} />,
    );

    await user.click(screen.getByRole('button', { name: 'Open favorite Pizza Night' }));

    expect(onOpen).toHaveBeenCalledWith('pizza');
    expect(onToggleFavorite).not.toHaveBeenCalled();
  });

  it('unfavorites a wheel from the section star button', async () => {
    const user = userEvent.setup();
    const onToggleFavorite = vi.fn();
    renderWithProviders(
      <FavoriteWheelsCard wheels={[pizza]} onOpen={vi.fn()} onToggleFavorite={onToggleFavorite} />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove Pizza Night from favorites' }));

    expect(onToggleFavorite).toHaveBeenCalledWith('pizza');
  });
});
