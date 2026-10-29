import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { RecentlyUsedWheelsCard } from '@/features/dashboard/components/RecentlyUsedWheelsCard';
import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import type { RecentWheelUsage } from '@/features/dashboard/utils/selectDashboardData';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import type { Wheel } from '@/types/wheel';

function createWheel(overrides: Partial<Wheel> & Pick<Wheel, 'id' | 'name'>): Wheel {
  return {
    description: undefined,
    category: 'General',
    items: [],
    settings: DEFAULT_WHEEL_SETTINGS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const pizza: RecentWheelUsage = {
  wheel: createWheel({ id: 'pizza', name: 'Pizza Night', category: 'Food' }),
  lastUsedAt: '2026-01-04T00:00:00.000Z',
};

const chores: RecentWheelUsage = {
  wheel: createWheel({ id: 'chores', name: 'Chores', category: 'Decisions' }),
  lastUsedAt: '2026-01-05T12:00:00.000Z',
};

describe('RecentlyUsedWheelsCard', () => {
  it('shows an empty state when there are no recently used wheels', () => {
    renderWithProviders(<RecentlyUsedWheelsCard wheels={[]} onOpen={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Recently used wheels', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('No recently used wheels yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('lists recently used wheels with last-used times', () => {
    renderWithProviders(<RecentlyUsedWheelsCard wheels={[pizza, chores]} onOpen={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Open recently used Pizza Night' })).toBeInTheDocument();
    expect(screen.getByText('Pizza Night')).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(pizza.lastUsedAt))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open recently used Chores' })).toBeInTheDocument();
    expect(screen.getAllByTestId('HistoryIcon')).toHaveLength(2);
    expect(screen.queryByText('No recently used wheels yet.')).not.toBeInTheDocument();
  });

  it('opens a recently used wheel', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    renderWithProviders(<RecentlyUsedWheelsCard wheels={[pizza, chores]} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: 'Open recently used Pizza Night' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith('pizza');
  });
});
