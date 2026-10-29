import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import { HistoryList } from '@/features/history/components/HistoryList';
import { HISTORY_MESSAGES, HISTORY_MODE_LABELS } from '@/features/history/constants';
import { formatDuration } from '@/features/history/utils/formatDuration';
import type { HistoryResult } from '@/features/history/utils/selectHistory';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';
import { SELECTION_MODE } from '@/types/wheel';

const pizza: HistoryResult = {
  id: 'r1',
  sessionId: 'session-r1',
  wheelId: 'pizza',
  wheelName: 'Pizza Night',
  selectedItemId: 'large',
  selectedItemName: 'Large',
  path: ['pizza', 'chicken-pepperoni', 'large'],
  pathLabels: ['Pizza', 'Chicken Pepperoni', 'Large'],
  pathLabel: 'Pizza → Chicken Pepperoni → Large',
  timestamp: '2026-01-04T12:00:00.000Z',
  duration: 4000,
  mode: SELECTION_MODE.manual,
};

const dishes: HistoryResult = {
  id: 'r2',
  sessionId: 'session-r2',
  wheelId: 'chores',
  wheelName: 'Chores',
  selectedItemId: 'dishes',
  selectedItemName: 'Dishes',
  path: ['dishes'],
  pathLabels: ['Dishes'],
  pathLabel: 'Dishes',
  timestamp: '2026-01-05T12:00:00.000Z',
  duration: 800,
  mode: SELECTION_MODE.ask,
};

describe('HistoryList', () => {
  it('renders an empty history region', () => {
    renderWithProviders(<HistoryList results={[]} onView={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole('region', { name: HISTORY_MESSAGES.resultsAria })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('lists results with path, wheel, time, mode, and duration', () => {
    renderWithProviders(<HistoryList results={[pizza, dishes]} onView={vi.fn()} onDelete={vi.fn()} />);

    const region = screen.getByRole('region', { name: HISTORY_MESSAGES.resultsAria });
    const items = region.querySelectorAll('.MuiListItem-root');

    expect(within(region).getByText(pizza.pathLabel)).toBeInTheDocument();
    expect(within(region).getByText(
      `${pizza.wheelName} · ${formatDateTime(pizza.timestamp)} · ${HISTORY_MODE_LABELS[pizza.mode]} · ${formatDuration(pizza.duration)}`,
    )).toBeInTheDocument();
    expect(within(region).getByText(dishes.pathLabel)).toBeInTheDocument();
    expect(items[0]).toHaveClass('MuiListItem-divider');
    expect(items[1]).not.toHaveClass('MuiListItem-divider');
  });

  it('opens details from the row or the view button', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    renderWithProviders(<HistoryList results={[pizza, dishes]} onView={onView} onDelete={vi.fn()} />);

    await user.click(screen.getByText(pizza.pathLabel));
    expect(onView).toHaveBeenCalledWith(pizza);

    await user.click(
      screen.getByRole('button', { name: `${HISTORY_MESSAGES.viewDetails}: ${dishes.pathLabel}` }),
    );
    expect(onView).toHaveBeenCalledWith(dishes);
  });

  it('requests delete from the delete button', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderWithProviders(<HistoryList results={[pizza, dishes]} onView={vi.fn()} onDelete={onDelete} />);

    await user.click(
      screen.getByRole('button', { name: `${HISTORY_MESSAGES.deleteResult}: ${dishes.pathLabel}` }),
    );

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(dishes);
  });
});
