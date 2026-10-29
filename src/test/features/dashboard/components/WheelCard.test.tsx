import { DEFAULT_WHEEL_CATEGORY, DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WheelCard } from '@/features/dashboard/components/WheelCard';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import type { Wheel, WheelItem } from '@/types/wheel';

function createItem(id: string, name: string): WheelItem {
  return {
    id,
    name,
    color: '#4f46e5',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createWheel(overrides: Partial<Wheel> = {}): Wheel {
  return {
    id: 'pizza',
    name: 'Pizza Night',
    description: 'Weekend dinner',
    category: 'Food',
    items: [createItem('pepperoni', 'Pepperoni'), createItem('margherita', 'Margherita')],
    settings: DEFAULT_WHEEL_SETTINGS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderCard(overrides: Partial<Parameters<typeof WheelCard>[0]> = {}) {
  const props = {
    wheel: createWheel(),
    isFavorite: false,
    onOpen: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleFavorite: vi.fn(),
    ...overrides,
  };

  renderWithProviders(<WheelCard {...props} />);
  return props;
}

describe('WheelCard', () => {
  it('renders name, category, description, and plural item count', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'Pizza Night', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Weekend dinner')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Pizza Night to favorites' })).toBeInTheDocument();
    expect(screen.getByTestId('FavoriteBorderIcon')).toBeInTheDocument();
  });

  it('falls back to the default category and no-description copy', () => {
    renderCard({
      wheel: createWheel({
        description: '   ',
        category: undefined,
        items: [createItem('yes', 'Yes')],
      }),
    });

    expect(screen.getByText(DEFAULT_WHEEL_CATEGORY)).toBeInTheDocument();
    expect(screen.getByText('No description')).toBeInTheDocument();
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('shows a filled favorite control when the wheel is favorited', () => {
    renderCard({ isFavorite: true });

    expect(screen.getByRole('button', { name: 'Remove Pizza Night from favorites' })).toBeInTheDocument();
    expect(screen.getByTestId('FavoriteIcon')).toBeInTheDocument();
    expect(screen.queryByTestId('FavoriteBorderIcon')).not.toBeInTheDocument();
  });

  it('invokes open, edit, delete, and favorite actions', async () => {
    const user = userEvent.setup();
    const { onOpen, onEdit, onDelete, onToggleFavorite } = renderCard();

    await user.click(screen.getByRole('button', { name: 'Open Pizza Night' }));
    await user.click(screen.getByRole('button', { name: 'Edit Pizza Night' }));
    await user.click(screen.getByRole('button', { name: 'Delete Pizza Night' }));
    await user.click(screen.getByRole('button', { name: 'Add Pizza Night to favorites' }));

    expect(onOpen).toHaveBeenCalledWith('pizza');
    expect(onEdit).toHaveBeenCalledWith('pizza');
    expect(onDelete).toHaveBeenCalledWith('pizza');
    expect(onToggleFavorite).toHaveBeenCalledWith('pizza');
  });
});
