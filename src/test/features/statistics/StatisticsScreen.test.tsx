import { ROUTES } from '@/constants/routes';
import { STATISTICS_MESSAGES } from '@/features/statistics/constants';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { renderApp, screen } from '@/test/test-utils';
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

  it('shows an empty state when there is no history', () => {
    renderApp({ initialEntries: [ROUTES.statistics] });

    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.title, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.emptyTitle })).toBeInTheDocument();
    expect(screen.getByText(STATISTICS_MESSAGES.emptyDescription)).toBeInTheDocument();
  });

  it('renders derived totals, highlights, and charts from history', () => {
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

    renderApp({ initialEntries: [ROUTES.statistics] });

    expect(screen.getByText(STATISTICS_MESSAGES.totalSpins).nextElementSibling).toHaveTextContent('6');
    expect(
      screen.getByText(STATISTICS_MESSAGES.totalCompletedSelections).nextElementSibling,
    ).toHaveTextContent('3');
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedParent).nextElementSibling).toHaveTextContent(
      'Pizza',
    );
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedChild).nextElementSibling).toHaveTextContent(
      'Beef Pepperoni',
    );
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.spinFrequency })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.winnerDistribution })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.parentVsChild })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.spinsPerWheel })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.selectionFrequency })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: STATISTICS_MESSAGES.frequencyAria })).toBeInTheDocument();
    expect(screen.getByText('33.3%')).toBeInTheDocument();
  });
});
