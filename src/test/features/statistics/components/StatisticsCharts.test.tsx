import type { ComponentProps, ReactNode } from 'react';

import { StatisticsCharts } from '@/features/statistics/components/StatisticsCharts';
import { STATISTICS_MESSAGES } from '@/features/statistics/constants';
import type { StatisticsSnapshot } from '@/features/statistics/utils/selectStatistics';
import { renderWithProviders, screen } from '@/test/test-utils';

const colorHarness = vi.hoisted(() => ({
  colors: ['#4f46e5', '#0f766e'] as Array<string | undefined>,
}));

vi.mock('@/constants/wheel', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/constants/wheel')>();

  return {
    ...actual,
    get ITEM_COLORS() {
      return colorHarness.colors;
    },
  };
});

vi.mock('recharts', async (importOriginal) => {
  const React = await import('react');
  const actual = await importOriginal<typeof import('recharts')>();

  function ResponsiveContainer({ children }: { children?: ReactNode }) {
    const sized = React.isValidElement(children)
      ? React.cloneElement(
          children as React.ReactElement<{ width?: number; height?: number }>,
          { width: 800, height: 280 },
        )
      : children;

    return React.createElement('div', { style: { width: 800, height: 280 } }, sized);
  }

  function YAxis(
    props: ComponentProps<typeof actual.YAxis> & { tickFormatter?: (value: string) => string },
  ) {
    if (!props.tickFormatter) {
      return React.createElement(actual.YAxis, props);
    }

    return React.createElement(
      'span',
      { 'data-testid': 'wheel-tick-labels' },
      `${props.tickFormatter('Short name')} ${props.tickFormatter('A really long wheel title')}`,
    );
  }

  return {
    ...actual,
    ResponsiveContainer,
    YAxis,
  };
});

function snapshot(overrides: Partial<StatisticsSnapshot> = {}): StatisticsSnapshot {
  return {
    totalSpins: 2,
    totalCompletedSelections: 2,
    selectionFrequency: [{ name: 'Pizza', count: 2, percent: 100 }],
    winnerDistribution: [{ name: 'Pizza', count: 2, percent: 100 }],
    winnerDistributionChart: [{ name: 'Pizza', count: 2, percent: 100 }],
    spinsPerWheel: [{ wheelId: 'pizza', wheelName: 'Pizza Night', selections: 2, spins: 2 }],
    dailySpinCount: [{ date: '2026-01-04', label: 'Jan 4', spins: 2, selections: 2 }],
    parentVsChild: [
      { name: STATISTICS_MESSAGES.parent, count: 1, percent: 50 },
      { name: STATISTICS_MESSAGES.child, count: 1, percent: 50 },
    ],
    ...overrides,
  };
}

describe('StatisticsCharts', () => {
  afterEach(() => {
    colorHarness.colors = ['#4f46e5', '#0f766e'];
  });

  it('renders chart sections and the selection frequency table', () => {
    renderWithProviders(<StatisticsCharts snapshot={snapshot()} />);

    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.spinFrequency })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.winnerDistribution })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.parentVsChild })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.spinsPerWheel })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.selectionFrequency })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: STATISTICS_MESSAGES.frequencyAria })).toBeInTheDocument();
    expect(screen.queryByText(STATISTICS_MESSAGES.noChildSelections)).not.toBeInTheDocument();
    expect(screen.getByTestId('wheel-tick-labels')).toHaveTextContent(
      'Short name A really long w…',
    );
  });

  it('notes when there are no child selections', () => {
    renderWithProviders(
      <StatisticsCharts
        snapshot={snapshot({
          parentVsChild: [
            { name: STATISTICS_MESSAGES.parent, count: 2, percent: 100 },
            { name: STATISTICS_MESSAGES.child, count: 0, percent: 0 },
          ],
        })}
      />,
    );

    expect(screen.getByText(STATISTICS_MESSAGES.noChildSelections)).toBeInTheDocument();
  });

  it('does not treat a missing child row as a zero count', () => {
    renderWithProviders(
      <StatisticsCharts
        snapshot={snapshot({
          parentVsChild: [{ name: STATISTICS_MESSAGES.parent, count: 2, percent: 100 }],
        })}
      />,
    );

    expect(screen.queryByText(STATISTICS_MESSAGES.noChildSelections)).not.toBeInTheDocument();
  });

  it('falls back when a pie slice color is missing', () => {
    colorHarness.colors = [undefined, undefined];
    renderWithProviders(
      <StatisticsCharts
        snapshot={snapshot({
          winnerDistributionChart: [
            { name: 'Pizza', count: 1, percent: 50 },
            { name: 'Burger', count: 1, percent: 50 },
          ],
        })}
      />,
    );

    expect(screen.getByRole('heading', { name: STATISTICS_MESSAGES.winnerDistribution })).toBeInTheDocument();
  });
});
