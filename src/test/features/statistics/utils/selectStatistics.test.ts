import { SELECTION_MODE, type SelectionMode } from '@/types/wheel';
import type { HistoryResult } from '@/features/history/utils/selectHistory';
import { STATISTICS_DATE_RANGE } from '@/features/statistics/constants';
import {
  filterHistoryResultsByRange,
  percentOf,
  selectStatistics,
  toChartSlices,
} from '@/features/statistics/utils/selectStatistics';

function result(
  overrides: Partial<HistoryResult> & Pick<HistoryResult, 'id'>,
): HistoryResult {
  const pathLabels = overrides.pathLabels ?? ['Pizza', 'Chicken Pepperoni', 'Large'];
  const selectedItemName = overrides.selectedItemName ?? pathLabels[pathLabels.length - 1] ?? 'Large';

  return {
    sessionId: `session-${overrides.id}`,
    wheelId: 'pizza',
    wheelName: 'Pizza Night',
    selectedItemId: overrides.selectedItemId ?? selectedItemName.toLowerCase(),
    selectedItemName,
    path: overrides.path ?? pathLabels.map((label) => label.toLowerCase()),
    pathLabels,
    pathLabel: overrides.pathLabel ?? pathLabels.join(' → '),
    timestamp: '2026-01-04T12:00:00.000Z',
    duration: 4000,
    mode: SELECTION_MODE.manual,
    ...overrides,
  };
}

const pizzaLarge = result({
  id: 'r1',
  timestamp: '2026-01-04T12:00:00.000Z',
});
const pizzaBeef = result({
  id: 'r2',
  selectedItemName: 'Beef Pepperoni',
  pathLabels: ['Pizza', 'Beef Pepperoni'],
  timestamp: '2026-01-04T18:00:00.000Z',
});
const burger = result({
  id: 'r3',
  wheelId: 'food',
  wheelName: 'Food Wheel',
  selectedItemName: 'Burger',
  pathLabels: ['Burger'],
  timestamp: '2026-01-06T12:00:00.000Z',
  mode: SELECTION_MODE.ask as SelectionMode,
});

describe('selectStatistics', () => {
  it('returns empty metrics when there is no history', () => {
    const stats = selectStatistics([]);

    expect(stats.totalSpins).toBe(0);
    expect(stats.totalCompletedSelections).toBe(0);
    expect(stats.uniqueWinners).toBe(0);
    expect(stats.mostSelectedItem).toBeUndefined();
    expect(stats.leastSelectedItem).toBeUndefined();
    expect(stats.mostSelectedParent).toBeUndefined();
    expect(stats.mostSelectedChild).toBeUndefined();
    expect(stats.mostSelectedPath).toBeUndefined();
    expect(stats.selectionFrequency).toEqual([]);
    expect(stats.parentFrequency).toEqual([]);
    expect(stats.childFrequency).toEqual([]);
    expect(stats.pathFrequency).toEqual([]);
    expect(stats.winnerDistribution).toEqual([]);
    expect(stats.spinsPerWheel).toEqual([]);
    expect(stats.dailySpinCount).toEqual([]);
    expect(stats.weeklySpinCount).toEqual([]);
    expect(stats.monthlySpinCount).toEqual([]);
    expect(stats.parentVsChild.map((entry) => entry.count)).toEqual([0, 0]);
  });

  it('derives spin, selection, parent, child, and path metrics from history', () => {
    const stats = selectStatistics([pizzaLarge, pizzaBeef, burger]);

    expect(stats.totalCompletedSelections).toBe(3);
    expect(stats.totalSpins).toBe(6);
    expect(stats.uniqueWinners).toBe(3);
    expect(stats.mostSelectedItem).toEqual({
      name: 'Pizza',
      count: 2,
      percent: percentOf(2, 6),
    });
    // Tied at count 1; alphabetical last among lowest counts.
    expect(stats.leastSelectedItem?.name).toBe('Large');
    expect(stats.mostSelectedParent).toEqual({ name: 'Pizza', count: 2, percent: percentOf(2, 3) });
    expect(stats.mostSelectedChild).toEqual({
      name: 'Beef Pepperoni',
      count: 1,
      percent: percentOf(1, 3),
    });
    expect(stats.mostSelectedPath?.name).toBe('Burger');
    expect(stats.selectionFrequency[0]).toEqual({
      name: 'Pizza',
      count: 2,
      percent: percentOf(2, 6),
    });
    expect(stats.parentFrequency[0]?.name).toBe('Pizza');
    expect(stats.childFrequency.map((entry) => entry.name)).toEqual([
      'Beef Pepperoni',
      'Chicken Pepperoni',
      'Large',
    ]);
    expect(stats.pathFrequency.map((entry) => entry.name)).toContain('Burger');
    expect(stats.winnerDistribution.map((entry) => entry.name)).toEqual([
      'Beef Pepperoni',
      'Burger',
      'Large',
    ]);
    expect(stats.spinsPerWheel).toEqual([
      { wheelId: 'pizza', wheelName: 'Pizza Night', selections: 2, spins: 5 },
      { wheelId: 'food', wheelName: 'Food Wheel', selections: 1, spins: 1 },
    ]);
    expect(stats.parentVsChild[0]).toEqual({ name: 'Parent', count: 3, percent: percentOf(3, 6) });
    expect(stats.parentVsChild[1]).toEqual({ name: 'Child', count: 3, percent: percentOf(3, 6) });
    expect(stats.weeklySpinCount.length).toBeGreaterThan(0);
    expect(stats.monthlySpinCount.map((entry) => entry.key)).toEqual(['2026-01']);
  });

  it('filters by date range without mutating the source history results', () => {
    const now = new Date(2026, 0, 6, 20, 0, 0);
    const todayBurger = result({
      id: 'r3',
      wheelId: 'food',
      wheelName: 'Food Wheel',
      selectedItemName: 'Burger',
      pathLabels: ['Burger'],
      timestamp: new Date(2026, 0, 6, 12, 0, 0).toISOString(),
    });
    const olderPizza = result({
      id: 'r1',
      timestamp: new Date(2026, 0, 1, 12, 0, 0).toISOString(),
    });
    const frozen = [olderPizza, todayBurger].map((entry) => ({
      ...entry,
      pathLabels: [...entry.pathLabels],
    }));

    const filteredToday = filterHistoryResultsByRange(frozen, STATISTICS_DATE_RANGE.today, now);
    expect(filteredToday).toHaveLength(1);
    expect(filteredToday[0]?.selectedItemName).toBe('Burger');
    expect(frozen[0]?.pathLabels).toEqual(['Pizza', 'Chicken Pepperoni', 'Large']);

    const todayOnly = selectStatistics(frozen, {
      range: STATISTICS_DATE_RANGE.today,
      now,
    });
    expect(todayOnly.totalCompletedSelections).toBe(1);
    expect(todayOnly.mostSelectedItem?.name).toBe('Burger');

    const last30 = selectStatistics(frozen, {
      range: STATISTICS_DATE_RANGE.days30,
      now,
    });
    expect(last30.totalCompletedSelections).toBe(2);

    const allTime = selectStatistics(frozen, {
      range: STATISTICS_DATE_RANGE.all,
      now,
    });
    expect(allTime.totalCompletedSelections).toBe(2);
    expect(frozen).toHaveLength(2);
  });

  it('treats a root-only result as a parent selection with no children', () => {
    const stats = selectStatistics([burger]);

    expect(stats.totalSpins).toBe(1);
    expect(stats.mostSelectedParent?.name).toBe('Burger');
    expect(stats.mostSelectedChild).toBeUndefined();
    expect(stats.parentVsChild[1]?.count).toBe(0);
  });

  it('fills missing days between the first and last spin', () => {
    const stats = selectStatistics([pizzaLarge, burger]);

    expect(stats.dailySpinCount).toHaveLength(3);
    expect(stats.dailySpinCount[0]?.spins).toBe(3);
    expect(stats.dailySpinCount[0]?.selections).toBe(1);
    expect(stats.dailySpinCount[1]?.spins).toBe(0);
    expect(stats.dailySpinCount[1]?.selections).toBe(0);
    expect(stats.dailySpinCount[2]?.spins).toBe(1);
    expect(stats.dailySpinCount[2]?.selections).toBe(1);
  });

  it('groups extra winner slices into Other', () => {
    const results = Array.from({ length: 10 }, (_, index) =>
      result({
        id: `w${index}`,
        selectedItemName: `Winner ${index}`,
        pathLabels: [`Winner ${index}`],
      }),
    );
    const slices = toChartSlices(selectStatistics(results).winnerDistribution);

    expect(slices).toHaveLength(9);
    expect(slices[8]).toEqual({ name: 'Other', count: 2, percent: 20 });
  });

  it('copies chart slices when they already fit the limit', () => {
    const items = [
      { name: 'A', count: 1, percent: 50 },
      { name: 'B', count: 1, percent: 50 },
    ];

    expect(toChartSlices(items)).toEqual(items);
    expect(toChartSlices(items)).not.toBe(items);
  });

  it('returns 0 percent when the total is not positive', () => {
    expect(percentOf(4, 0)).toBe(0);
    expect(percentOf(4, -1)).toBe(0);
  });

  it('uses the selected item name when path labels are missing', () => {
    const stats = selectStatistics([
      result({
        id: 'sushi',
        pathLabels: [],
        pathLabel: '',
        selectedItemName: 'Sushi',
      }),
    ]);

    expect(stats.mostSelectedParent?.name).toBe('Sushi');
    expect(stats.mostSelectedPath?.name).toBe('Sushi');
    expect(stats.totalSpins).toBe(1);
  });

  it('skips empty parent and path names', () => {
    const stats = selectStatistics([
      result({
        id: 'empty',
        pathLabels: [],
        pathLabel: '',
        selectedItemName: '',
      }),
    ]);

    expect(stats.mostSelectedParent).toBeUndefined();
    expect(stats.mostSelectedPath).toBeUndefined();
    expect(stats.totalSpins).toBe(1);
  });

  it('sorts wheels with equal spins by name', () => {
    const stats = selectStatistics([
      result({ id: 'z', wheelId: 'zeta', wheelName: 'Zeta', pathLabels: ['Lemon'] }),
      result({ id: 'a', wheelId: 'alpha', wheelName: 'Alpha', pathLabels: ['Apple'] }),
    ]);

    expect(stats.spinsPerWheel.map((wheel) => wheel.wheelName)).toEqual(['Alpha', 'Zeta']);
  });

  it('sorts equal-count winners and parents alphabetically', () => {
    const stats = selectStatistics([
      result({ id: 'z', selectedItemName: 'Zucchini', pathLabels: ['Zucchini'] }),
      result({ id: 'a', selectedItemName: 'Apple', pathLabels: ['Apple'] }),
    ]);

    expect(stats.winnerDistribution.map((entry) => entry.name)).toEqual(['Apple', 'Zucchini']);
    expect(stats.mostSelectedParent?.name).toBe('Apple');
    expect(stats.selectionFrequency.map((entry) => entry.name)).toEqual(['Apple', 'Zucchini']);
  });

  it('keeps an unparseable timestamp as a day key', () => {
    const stats = selectStatistics([result({ id: 'bad', timestamp: 'not-a-date', pathLabels: ['Pizza'] })]);

    expect(stats.dailySpinCount[0]?.date).toBe('not-a-date');
  });

  it('omits a daily series when the timestamp cannot form a day key', () => {
    const stats = selectStatistics([result({ id: 'blank', timestamp: '', pathLabels: ['Pizza'] })]);

    expect(stats.dailySpinCount).toEqual([]);
  });

  it('lists only days with spins when the range exceeds 90 days', () => {
    const stats = selectStatistics([
      result({ id: 'early', timestamp: '2026-01-01T12:00:00.000Z', pathLabels: ['Alpha'] }),
      result({ id: 'late', timestamp: '2026-06-01T12:00:00.000Z', pathLabels: ['Zeta'] }),
    ]);

    expect(stats.dailySpinCount.map((entry) => entry.date)).toEqual(['2026-01-01', '2026-06-01']);
  });
});
