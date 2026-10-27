import {
  STATISTICS_MAX_DAILY_SPAN,
  STATISTICS_MESSAGES,
  STATISTICS_OTHER_LABEL,
  STATISTICS_TOP_CHART_ITEMS,
} from '@/features/statistics/constants';
import type { HistoryResult } from '@/features/history/utils/selectHistory';

export interface NamedCount {
  name: string;
  count: number;
  percent: number;
}

export interface WheelSpinCount {
  wheelId: string;
  wheelName: string;
  selections: number;
  spins: number;
}

export interface DailySpinCount {
  date: string;
  label: string;
  spins: number;
  selections: number;
}

export interface StatisticsSnapshot {
  totalSpins: number;
  totalCompletedSelections: number;
  mostSelectedParent?: NamedCount;
  mostSelectedChild?: NamedCount;
  mostSelectedPath?: NamedCount;
  selectionFrequency: NamedCount[];
  winnerDistribution: NamedCount[];
  winnerDistributionChart: NamedCount[];
  spinsPerWheel: WheelSpinCount[];
  dailySpinCount: DailySpinCount[];
  parentVsChild: NamedCount[];
}

interface CountAcc {
  name: string;
  count: number;
}

const EMPTY_SNAPSHOT: StatisticsSnapshot = {
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
};

export function percentOf(count: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((count / total) * 1000) / 10;
}

export function toChartSlices(
  items: readonly NamedCount[],
  limit = STATISTICS_TOP_CHART_ITEMS,
): NamedCount[] {
  if (items.length <= limit) {
    return [...items];
  }

  const head = items.slice(0, limit);
  const restCount = items.slice(limit).reduce((sum, item) => sum + item.count, 0);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return [
    ...head,
    {
      name: STATISTICS_OTHER_LABEL,
      count: restCount,
      percent: percentOf(restCount, total),
    },
  ];
}

export function selectStatistics(results: readonly HistoryResult[]): StatisticsSnapshot {
  if (results.length === 0) {
    return EMPTY_SNAPSHOT;
  }

  const parentCounts = new Map<string, CountAcc>();
  const childCounts = new Map<string, CountAcc>();
  const itemCounts = new Map<string, CountAcc>();
  const pathCounts = new Map<string, CountAcc>();
  const winnerCounts = new Map<string, CountAcc>();
  const wheelCounts = new Map<string, WheelSpinCount>();
  const dailyCounts = new Map<string, { spins: number; selections: number }>();

  let totalSpins = 0;
  let parentStepCount = 0;
  let childStepCount = 0;

  for (const result of results) {
    const steps = pathSteps(result);
    const spinCount = Math.max(steps.length, 1);
    totalSpins += spinCount;

    const parentName = steps[0];
    if (parentName) {
      bump(parentCounts, parentName);
      parentStepCount += 1;
    }

    for (const childName of steps.slice(1)) {
      bump(childCounts, childName);
      childStepCount += 1;
    }

    for (const name of steps) {
      bump(itemCounts, name);
    }

    const pathName = result.pathLabel || steps.join(' → ');
    if (pathName) {
      bump(pathCounts, pathName);
    }

    bump(winnerCounts, result.selectedItemName);

    const wheel = wheelCounts.get(result.wheelId) ?? {
      wheelId: result.wheelId,
      wheelName: result.wheelName,
      selections: 0,
      spins: 0,
    };
    wheel.selections += 1;
    wheel.spins += spinCount;
    wheelCounts.set(result.wheelId, wheel);

    const day = toDayKey(result.timestamp);
    const daily = dailyCounts.get(day) ?? { spins: 0, selections: 0 };
    daily.spins += spinCount;
    daily.selections += 1;
    dailyCounts.set(day, daily);
  }

  const selectionFrequency = toNamedCounts(itemCounts, totalSpins);
  const winnerDistribution = toNamedCounts(winnerCounts, results.length);
  const parentTotal = parentStepCount + childStepCount;

  return {
    totalSpins,
    totalCompletedSelections: results.length,
    mostSelectedParent: firstNamedCount(parentCounts, results.length),
    mostSelectedChild: firstNamedCount(childCounts, childStepCount),
    mostSelectedPath: firstNamedCount(pathCounts, results.length),
    selectionFrequency,
    winnerDistribution,
    winnerDistributionChart: toChartSlices(winnerDistribution),
    spinsPerWheel: [...wheelCounts.values()].sort(compareWheelSpins),
    dailySpinCount: buildDailySpinCount(dailyCounts),
    parentVsChild: [
      {
        name: STATISTICS_MESSAGES.parent,
        count: parentStepCount,
        percent: percentOf(parentStepCount, parentTotal),
      },
      {
        name: STATISTICS_MESSAGES.child,
        count: childStepCount,
        percent: percentOf(childStepCount, parentTotal),
      },
    ],
  };
}

function pathSteps(result: HistoryResult): string[] {
  if (result.pathLabels.length > 0) {
    return result.pathLabels;
  }

  return result.selectedItemName ? [result.selectedItemName] : [];
}

function bump(counts: Map<string, CountAcc>, name: string): void {
  const current = counts.get(name);
  if (current) {
    current.count += 1;
    return;
  }

  counts.set(name, { name, count: 1 });
}

function toNamedCounts(counts: Map<string, CountAcc>, total: number): NamedCount[] {
  return [...counts.values()]
    .map((entry) => ({
      name: entry.name,
      count: entry.count,
      percent: percentOf(entry.count, total),
    }))
    .sort(compareCountThenName);
}

function firstNamedCount(counts: Map<string, CountAcc>, total: number): NamedCount | undefined {
  return toNamedCounts(counts, total)[0];
}

function compareCountThenName(left: NamedCount, right: NamedCount): number {
  if (right.count !== left.count) {
    return right.count - left.count;
  }

  return left.name.localeCompare(right.name);
}

function compareWheelSpins(left: WheelSpinCount, right: WheelSpinCount): number {
  if (right.spins !== left.spins) {
    return right.spins - left.spins;
  }

  return left.wheelName.localeCompare(right.wheelName);
}

function toDayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 10);
  }

  return formatDayKey(date);
}

function formatDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDayKey(dayKey: string): Date {
  const [year = 1970, month = 1, day = 1] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDayLabel(dayKey: string): string {
  return parseDayKey(dayKey).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function daySpan(startKey: string, endKey: string): number {
  const start = parseDayKey(startKey).getTime();
  const end = parseDayKey(endKey).getTime();
  return Math.round((end - start) / 86_400_000);
}

function enumerateDays(startKey: string, endKey: string): string[] {
  const days: string[] = [];
  const current = parseDayKey(startKey);
  const end = parseDayKey(endKey);

  while (current <= end) {
    days.push(formatDayKey(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function buildDailySpinCount(counts: Map<string, { spins: number; selections: number }>): DailySpinCount[] {
  const keys = [...counts.keys()].sort();
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) {
    return [];
  }

  const days =
    daySpan(first, last) <= STATISTICS_MAX_DAILY_SPAN ? enumerateDays(first, last) : keys;

  return days.map((date) => {
    const entry = counts.get(date) ?? { spins: 0, selections: 0 };
    return {
      date,
      label: formatDayLabel(date),
      spins: entry.spins,
      selections: entry.selections,
    };
  });
}
