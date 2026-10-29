import { StatisticsHighlights } from '@/features/statistics/components/StatisticsHighlights';
import { STATISTICS_MESSAGES } from '@/features/statistics/constants';
import { formatPercent, formatTimes } from '@/features/statistics/utils/formatPercent';
import type { StatisticsSnapshot } from '@/features/statistics/utils/selectStatistics';
import { renderWithProviders, screen } from '@/test/test-utils';

function snapshot(overrides: Partial<StatisticsSnapshot> = {}): StatisticsSnapshot {
  return {
    totalSpins: 0,
    totalCompletedSelections: 0,
    selectionFrequency: [],
    winnerDistribution: [],
    winnerDistributionChart: [],
    spinsPerWheel: [],
    dailySpinCount: [],
    parentVsChild: [
      { name: STATISTICS_MESSAGES.parent, count: 0, percent: 0 },
      { name: STATISTICS_MESSAGES.child, count: 0, percent: 0 },
    ],
    ...overrides,
  };
}

describe('StatisticsHighlights', () => {
  it('shows zeros and none when there are no selections', () => {
    renderWithProviders(<StatisticsHighlights snapshot={snapshot()} />);

    expect(screen.getByText(STATISTICS_MESSAGES.totalSpins).nextElementSibling).toHaveTextContent('0');
    expect(
      screen.getByText(STATISTICS_MESSAGES.totalCompletedSelections).nextElementSibling,
    ).toHaveTextContent('0');
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedParent).nextElementSibling).toHaveTextContent(
      STATISTICS_MESSAGES.none,
    );
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedChild).nextElementSibling).toHaveTextContent(
      STATISTICS_MESSAGES.none,
    );
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedPath).nextElementSibling).toHaveTextContent(
      STATISTICS_MESSAGES.none,
    );
    expect(screen.queryByText(/time/)).not.toBeInTheDocument();
  });

  it('shows names and count hints for the most selected entries', () => {
    renderWithProviders(
      <StatisticsHighlights
        snapshot={snapshot({
          totalSpins: 4,
          totalCompletedSelections: 2,
          mostSelectedParent: { name: 'Pizza', count: 1, percent: 50 },
          mostSelectedChild: { name: 'Pepperoni', count: 2, percent: 33.333 },
          mostSelectedPath: { name: 'Pizza → Pepperoni', count: 2, percent: 100 },
        })}
      />,
    );

    expect(screen.getByText(STATISTICS_MESSAGES.totalSpins).nextElementSibling).toHaveTextContent('4');
    expect(
      screen.getByText(STATISTICS_MESSAGES.totalCompletedSelections).nextElementSibling,
    ).toHaveTextContent('2');
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedParent).nextElementSibling).toHaveTextContent(
      'Pizza',
    );
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedChild).nextElementSibling).toHaveTextContent(
      'Pepperoni',
    );
    expect(screen.getByText(STATISTICS_MESSAGES.mostSelectedPath).nextElementSibling).toHaveTextContent(
      'Pizza → Pepperoni',
    );
    expect(
      screen.getByText(`${formatTimes(1)} · ${formatPercent(50)}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${formatTimes(2)} · ${formatPercent(33.333)}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${formatTimes(2)} · ${formatPercent(100)}`),
    ).toBeInTheDocument();
  });
});
