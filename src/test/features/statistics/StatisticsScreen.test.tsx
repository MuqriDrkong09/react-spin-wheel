import { ROUTES } from '@/constants/routes';
import { STATISTICS_MESSAGES } from '@/features/statistics/constants';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { renderApp, screen, userEvent } from '@/test/test-utils';
import { SELECTION_MODE, SPIN_SESSION_STATUS, type SpinSession } from '@/types/wheel';

function historySession(
  id: string,
  extras: Partial<SpinSession> & {
    selectedItemName?: string;
    pathLabels?: string[];
    timestamp?: string;
    wheelName?: string;
    wheelId?: string;
  } = {},
): SpinSession {
  const selectedItemName = extras.selectedItemName ?? 'Large';
  const pathLabels = extras.pathLabels ?? ['Pizza', 'Chicken Pepperoni', 'Large'];
  const timestamp = extras.timestamp ?? '2026-01-04T12:00:00.000Z';
  const wheelId = extras.wheelId ?? 'pizza';
  const wheelName = extras.wheelName ?? 'Pizza Night';

  return {
    id,
    wheelId,
    wheelName,
    status: SPIN_SESSION_STATUS.completed,
    path: ['pizza', 'chicken-pepperoni', 'large'],
    startedAt: timestamp,
    completedAt: timestamp,
    results: [
      {
        id,
        sessionId: `session-${id}`,
        wheelId,
        itemId: 'large',
        itemName: selectedItemName,
        selectedItemId: 'large',
        selectedItemName,
        parentItemId: 'chicken-pepperoni',
        path: ['pizza', 'chicken-pepperoni', 'large'],
        pathLabels,
        depth: 2,
        probability: 1,
        timestamp,
        spunAt: timestamp,
        duration: 4000,
        mode: SELECTION_MODE.manual,
      },
    ],
    ...extras,
  };
}

describe('StatisticsScreen', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('shows an empty state when there is no history', async () => {
    await renderApp({ initialEntries: [ROUTES.statistics] });

    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.title, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.emptyTitle })).toBeInTheDocument();
    expect(screen.getByText(STATISTICS_MESSAGES.emptyDescription)).toBeInTheDocument();
  });

  it('renders derived totals, highlights, and charts from history', async () => {
    useHistoryStore.getState().addSpinSession(
      historySession('r1', { timestamp: '2026-01-04T12:00:00.000Z' }),
    );
    useHistoryStore.getState().addSpinSession(
      historySession('r2', {
        selectedItemName: 'Beef Pepperoni',
        pathLabels: ['Pizza', 'Beef Pepperoni'],
        timestamp: '2026-01-04T18:00:00.000Z',
      }),
    );
    useHistoryStore.getState().addSpinSession(
      historySession('r3', {
        wheelId: 'food',
        wheelName: 'Food Wheel',
        selectedItemName: 'Burger',
        pathLabels: ['Burger'],
        timestamp: '2026-01-06T12:00:00.000Z',
      }),
    );

    await renderApp({ initialEntries: [ROUTES.statistics] });

    expect(screen.getByText(STATISTICS_MESSAGES.totalSpins).nextElementSibling).toHaveTextContent('6');
    expect(screen.getByText(STATISTICS_MESSAGES.uniqueWinners).nextElementSibling).toHaveTextContent('3');
    expect(
      screen.getByText(STATISTICS_MESSAGES.totalCompletedSelections).nextElementSibling,
    ).toHaveTextContent('3');
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedItem).nextElementSibling).toHaveTextContent(
      'Pizza',
    );
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedParent).nextElementSibling).toHaveTextContent(
      'Pizza',
    );
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedChild).nextElementSibling).toHaveTextContent(
      'Beef Pepperoni',
    );
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedPath).nextElementSibling).toHaveTextContent(
      'Burger',
    );
    expect(screen.getByRole('group', { name: STATISTICS_MESSAGES.dateRange })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.spinFrequency })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.weeklyActivity })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.monthlyActivity })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.winnerDistribution })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.parentVsChild })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.spinsPerWheel })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.selectionFrequency })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.parentFrequency })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.childFrequency })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.pathFrequency })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: STATISTICS_MESSAGES.frequencyAria })).toBeInTheDocument();
    expect(screen.getAllByText('33.3%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pizza Night').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Food Wheel').length).toBeGreaterThan(0);
  });

  it('filters statistics by date range from immutable history', async () => {
    const user = userEvent.setup();
    useHistoryStore.getState().addSpinSession(
      historySession('old', {
        selectedItemName: 'Burger',
        pathLabels: ['Burger'],
        timestamp: '2025-01-01T12:00:00.000Z',
      }),
    );
    useHistoryStore.getState().addSpinSession(
      historySession('fresh', {
        selectedItemName: 'Pizza',
        pathLabels: ['Pizza'],
        timestamp: new Date().toISOString(),
      }),
    );

    await renderApp({ initialEntries: [ROUTES.statistics] });

    expect(screen.getByText(STATISTICS_MESSAGES.totalCompletedSelections).nextElementSibling).toHaveTextContent(
      '2',
    );

    await user.click(screen.getByRole('button', { name: STATISTICS_MESSAGES.rangeToday }));

    expect(screen.getByText(STATISTICS_MESSAGES.totalCompletedSelections).nextElementSibling).toHaveTextContent(
      '1',
    );
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedItem).nextElementSibling).toHaveTextContent(
      'Pizza',
    );
    expect(useHistoryStore.getState().spinHistory).toHaveLength(2);
  });

  it('shows an empty-range state when history exists but the filter matches nothing', async () => {
    const user = userEvent.setup();
    useHistoryStore.getState().addSpinSession(
      historySession('old', {
        selectedItemName: 'Burger',
        pathLabels: ['Burger'],
        timestamp: '2025-01-01T12:00:00.000Z',
      }),
    );

    await renderApp({ initialEntries: [ROUTES.statistics] });

    expect(screen.getByRole('group', { name: STATISTICS_MESSAGES.dateRange })).toBeInTheDocument();
    expect(screen.getByText(STATISTICS_MESSAGES.totalCompletedSelections).nextElementSibling).toHaveTextContent(
      '1',
    );

    await user.click(screen.getByRole('button', { name: STATISTICS_MESSAGES.rangeToday }));

    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.emptyRangeTitle })).toBeInTheDocument();
    expect(screen.getByText(STATISTICS_MESSAGES.emptyRangeDescription)).toBeInTheDocument();
    expect(screen.queryByText(STATISTICS_MESSAGES.totalSpins)).not.toBeInTheDocument();
    expect(useHistoryStore.getState().spinHistory).toHaveLength(1);
  });

  it('highlights the most repeated selection path', async () => {
    useHistoryStore.getState().addSpinSession(
      historySession('r1', {
        selectedItemName: 'Large',
        pathLabels: ['Pizza', 'Chicken Pepperoni', 'Large'],
      }),
    );
    useHistoryStore.getState().addSpinSession(
      historySession('r2', {
        selectedItemName: 'Large',
        pathLabels: ['Pizza', 'Chicken Pepperoni', 'Large'],
        timestamp: '2026-01-05T12:00:00.000Z',
      }),
    );
    useHistoryStore.getState().addSpinSession(
      historySession('r3', {
        selectedItemName: 'Burger',
        pathLabels: ['Burger'],
        timestamp: '2026-01-06T12:00:00.000Z',
      }),
    );

    await renderApp({ initialEntries: [ROUTES.statistics] });

    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedPath).nextElementSibling).toHaveTextContent(
      'Pizza → Chicken Pepperoni → Large',
    );
  });
});
