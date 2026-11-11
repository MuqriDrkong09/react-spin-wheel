import type { HistoryResult } from '@/features/history/utils/selectHistory';
import {
  STATISTICS_DATE_RANGE,
  STATISTICS_MAX_DAILY_SPAN,
  STATISTICS_MAX_MONTHLY_SPAN,
  STATISTICS_MAX_WEEKLY_SPAN,
  STATISTICS_MESSAGES,
  STATISTICS_OTHER_LABEL,
  STATISTICS_TOP_CHART_ITEMS,
  type StatisticsDateRange,
} from '@/features/statistics/constants';

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

export interface PeriodSpinCount {
  key: string;
  label: string;
  spins: number;
  selections: number;
}

export interface StatisticsSnapshot {
  totalSpins: number;
  totalCompletedSelections: number;
  uniqueWinners: number;
  mostSelectedItem?: NamedCount;
  leastSelectedItem?: NamedCount;
  mostSelectedParent?: NamedCount;
  mostSelectedChild?: NamedCount;
  mostSelectedPath?: NamedCount;
  selectionFrequency: NamedCount[];
  parentFrequency: NamedCount[];
  childFrequency: NamedCount[];
  pathFrequency: NamedCount[];
  winnerDistribution: NamedCount[];
  winnerDistributionChart: NamedCount[];
  spinsPerWheel: WheelSpinCount[];
  dailySpinCount: DailySpinCount[];
  weeklySpinCount: PeriodSpinCount[];
  monthlySpinCount: PeriodSpinCount[];
  parentVsChild: NamedCount[];
}

export interface SelectStatisticsOptions {
  range?: StatisticsDateRange;
  now?: Date;
}

interface CountAcc {
  name: string;
  count: number;
}

const EMPTY_SNAPSHOT: StatisticsSnapshot = {
  totalSpins: 0,
  totalCompletedSelections: 0,
  uniqueWinners: 0,
  selectionFrequency: [],
  parentFrequency: [],
  childFrequency: [],
  pathFrequency: [],
  winnerDistribution: [],
  winnerDistributionChart: [],
  spinsPerWheel: [],
  dailySpinCount: [],
  weeklySpinCount: [],
  monthlySpinCount: [],
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

/** Inclusive local-day start for the selected range. Returns null for all-time. */
export function rangeStartDate(range: StatisticsDateRange, now: Date = new Date()): Date | null {
  const today = startOfLocalDay(now);

  switch (range) {
    case STATISTICS_DATE_RANGE.today:
      return today;
    case STATISTICS_DATE_RANGE.days7: {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return start;
    }
    case STATISTICS_DATE_RANGE.days30: {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return start;
    }
    case STATISTICS_DATE_RANGE.all:
    default:
      return null;
  }
}

/**
 * Filters history results by date range without mutating the source array or records.
 */
export function filterHistoryResultsByRange(
  results: readonly HistoryResult[],
  range: StatisticsDateRange,
  now: Date = new Date(),
): HistoryResult[] {
  const start = rangeStartDate(range, now);
  if (!start) {
    return [...results];
  }

  const startMs = start.getTime();
  const endMs = now.getTime();

  return results.filter((result) => {
    const timestamp = Date.parse(result.timestamp);
    if (Number.isNaN(timestamp)) {
      return false;
    }
    return timestamp >= startMs && timestamp <= endMs;
  });
}

export function selectStatistics(
  results: readonly HistoryResult[],
  options: SelectStatisticsOptions = {},
): StatisticsSnapshot {
  const range = options.range ?? STATISTICS_DATE_RANGE.all;
  const now = options.now ?? new Date();
  const scoped = filterHistoryResultsByRange(results, range, now);

  if (scoped.length === 0) {
    return EMPTY_SNAPSHOT;
  }

  const parentCounts = new Map<string, CountAcc>();
  const childCounts = new Map<string, CountAcc>();
  const itemCounts = new Map<string, CountAcc>();
  const pathCounts = new Map<string, CountAcc>();
  const winnerCounts = new Map<string, CountAcc>();
  const wheelCounts = new Map<string, WheelSpinCount>();
  const dailyCounts = new Map<string, { spins: number; selections: number }>();
  const weeklyCounts = new Map<string, { spins: number; selections: number }>();
  const monthlyCounts = new Map<string, { spins: number; selections: number }>();

  let totalSpins = 0;
  let parentStepCount = 0;
  let childStepCount = 0;

  for (const result of scoped) {
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

    if (result.selectedItemName) {
      bump(winnerCounts, result.selectedItemName);
    }

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

    const week = toWeekKey(result.timestamp);
    const weekly = weeklyCounts.get(week) ?? { spins: 0, selections: 0 };
    weekly.spins += spinCount;
    weekly.selections += 1;
    weeklyCounts.set(week, weekly);

    const month = toMonthKey(result.timestamp);
    const monthly = monthlyCounts.get(month) ?? { spins: 0, selections: 0 };
    monthly.spins += spinCount;
    monthly.selections += 1;
    monthlyCounts.set(month, monthly);
  }

  const selectionFrequency = toNamedCounts(itemCounts, totalSpins);
  const parentFrequency = toNamedCounts(parentCounts, scoped.length);
  const childFrequency = toNamedCounts(childCounts, childStepCount);
  const pathFrequency = toNamedCounts(pathCounts, scoped.length);
  const winnerDistribution = toNamedCounts(winnerCounts, scoped.length);
  const parentTotal = parentStepCount + childStepCount;

  return {
    totalSpins,
    totalCompletedSelections: scoped.length,
    uniqueWinners: winnerCounts.size,
    mostSelectedItem: selectionFrequency[0],
    leastSelectedItem:
      selectionFrequency.length > 0 ? selectionFrequency[selectionFrequency.length - 1] : undefined,
    mostSelectedParent: parentFrequency[0],
    mostSelectedChild: childFrequency[0],
    mostSelectedPath: pathFrequency[0],
    selectionFrequency,
    parentFrequency,
    childFrequency,
    pathFrequency,
    winnerDistribution,
    winnerDistributionChart: toChartSlices(winnerDistribution),
    spinsPerWheel: [...wheelCounts.values()].sort(compareWheelSpins),
    dailySpinCount: buildDailySpinCount(dailyCounts),
    weeklySpinCount: buildWeeklySpinCount(weeklyCounts),
    monthlySpinCount: buildMonthlySpinCount(monthlyCounts),
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

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeekMonday(date: Date): Date {
  const day = startOfLocalDay(date);
  const weekday = day.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  day.setDate(day.getDate() + offset);
  return day;
}

function toDayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 10);
  }

  return formatDayKey(date);
}

function toWeekKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 10);
  }

  return formatDayKey(startOfWeekMonday(date));
}

function toMonthKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 7);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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

function formatWeekLabel(weekKey: string): string {
  return `Week of ${formatDayLabel(weekKey)}`;
}

function formatMonthLabel(monthKey: string): string {
  const [year = 1970, month = 1] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
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

function enumerateWeeks(startKey: string, endKey: string): string[] {
  const weeks: string[] = [];
  const current = startOfWeekMonday(parseDayKey(startKey));
  const end = startOfWeekMonday(parseDayKey(endKey));

  while (current <= end) {
    weeks.push(formatDayKey(current));
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

function enumerateMonths(startKey: string, endKey: string): string[] {
  const months: string[] = [];
  const [startYear = 1970, startMonth = 1] = startKey.split('-').map(Number);
  const [endYear = 1970, endMonth = 1] = endKey.split('-').map(Number);
  const current = new Date(startYear, startMonth - 1, 1);
  const end = new Date(endYear, endMonth - 1, 1);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

function buildDailySpinCount(
  counts: Map<string, { spins: number; selections: number }>,
): DailySpinCount[] {
  const keys = [...counts.keys()].filter(Boolean).sort();
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

function buildWeeklySpinCount(
  counts: Map<string, { spins: number; selections: number }>,
): PeriodSpinCount[] {
  const keys = [...counts.keys()].filter(Boolean).sort();
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) {
    return [];
  }

  const weekSpan = Math.round(daySpan(first, last) / 7);
  const weeks =
    weekSpan <= STATISTICS_MAX_WEEKLY_SPAN ? enumerateWeeks(first, last) : keys;

  return weeks.map((key) => {
    const entry = counts.get(key) ?? { spins: 0, selections: 0 };
    return {
      key,
      label: formatWeekLabel(key),
      spins: entry.spins,
      selections: entry.selections,
    };
  });
}

function buildMonthlySpinCount(
  counts: Map<string, { spins: number; selections: number }>,
): PeriodSpinCount[] {
  const keys = [...counts.keys()].filter(Boolean).sort();
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) {
    return [];
  }

  const [startYear = 1970, startMonth = 1] = first.split('-').map(Number);
  const [endYear = 1970, endMonth = 1] = last.split('-').map(Number);
  const monthSpan = (endYear - startYear) * 12 + (endMonth - startMonth);
  const months =
    monthSpan <= STATISTICS_MAX_MONTHLY_SPAN ? enumerateMonths(first, last) : keys;

  return months.map((key) => {
    const entry = counts.get(key) ?? { spins: 0, selections: 0 };
    return {
      key,
      label: formatMonthLabel(key),
      spins: entry.spins,
      selections: entry.selections,
    };
  });
}
