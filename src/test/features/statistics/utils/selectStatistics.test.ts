import { SELECTION_MODE, type SelectionMode } from '@/types/wheel';
import type { HistoryResult } from '@/features/history/utils/selectHistory';
import {
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
    expect(stats.mostSelectedParent).toBeUndefined();
    expect(stats.mostSelectedChild).toBeUndefined();
    expect(stats.mostSelectedPath).toBeUndefined();
    expect(stats.selectionFrequency).toEqual([]);
    expect(stats.winnerDistribution).toEqual([]);
    expect(stats.spinsPerWheel).toEqual([]);
    expect(stats.dailySpinCount).toEqual([]);
    expect(stats.parentVsChild.map((entry) => entry.count)).toEqual([0, 0]);
  });

  it('derives spin, selection, parent, child, and path metrics from history', () => {
    const stats = selectStatistics([pizzaLarge, pizzaBeef, burger]);

    expect(stats.totalCompletedSelections).toBe(3);
    expect(stats.totalSpins).toBe(6);
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
    const slices = toChartSlices(selectStatistics(results).winnerDistribution, 8);

    expect(slices).toHaveLength(9);
    expect(slices[8]).toEqual({ name: 'Other', count: 2, percent: 20 });
  });
});
