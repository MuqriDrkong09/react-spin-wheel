import { FavoriteStarButton } from '@/features/dashboard/components/FavoriteStarButton';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

describe('FavoriteStarButton', () => {
  it('exposes an unpressed star control for wheels that are not favorited', () => {
    renderWithProviders(
      <FavoriteStarButton name="Pizza Night" isFavorite={false} onToggle={vi.fn()} />,
    );

    const button = screen.getByRole('button', { name: 'Add Pizza Night to favorites' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('StarBorderIcon')).toBeInTheDocument();
  });

  it('exposes a pressed star control for favorited wheels', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderWithProviders(<FavoriteStarButton name="Pizza Night" isFavorite onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: 'Remove Pizza Night from favorites' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('StarIcon')).toBeInTheDocument();

    await user.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
