import { RecentResultsCard } from '@/features/dashboard/components/RecentResultsCard';
import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import type { RecentResult } from '@/features/dashboard/utils/selectDashboardData';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const pepperoni: RecentResult = {
  id: 'r1',
  wheelId: 'pizza',
  wheelName: 'Pizza Night',
  itemName: 'Pepperoni',
  spunAt: '2026-01-04T00:00:00.000Z',
};

const yes: RecentResult = {
  id: 'r2',
  wheelId: 'quick',
  wheelName: 'Quick Pick',
  itemName: 'Yes',
  spunAt: '2026-01-05T12:00:00.000Z',
};

describe('RecentResultsCard', () => {
  it('shows an empty state when there are no results', () => {
    renderWithProviders(<RecentResultsCard results={[]} onOpen={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Recently selected results', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('No selected results yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('lists recent results with wheel name and time', () => {
    renderWithProviders(<RecentResultsCard results={[pepperoni, yes]} onOpen={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Open result Pepperoni' })).toBeInTheDocument();
    expect(screen.getByText('Pepperoni')).toBeInTheDocument();
    expect(screen.getByText(`Pizza Night · ${formatDateTime(pepperoni.spunAt)}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open result Yes' })).toBeInTheDocument();
    expect(screen.getAllByTestId('EmojiEventsOutlinedIcon')).toHaveLength(2);
    expect(screen.queryByText('No selected results yet.')).not.toBeInTheDocument();
  });

  it('opens the wheel for a selected result', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    renderWithProviders(<RecentResultsCard results={[pepperoni, yes]} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: 'Open result Pepperoni' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith('pizza');
  });
});
