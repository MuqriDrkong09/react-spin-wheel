export const STATISTICS_MESSAGES = {
  title: 'Statistics',
  description: 'See spin and wheel trends from your history.',
  emptyTitle: 'No statistics yet',
  emptyDescription: 'Finish a selection to see trends from your spin history.',
  emptyRangeTitle: 'No spins in this range',
  emptyRangeDescription: 'Try a wider date range to see statistics from your history.',
  totalSpins: 'Total spins',
  totalCompletedSelections: 'Total completed selections',
  uniqueWinners: 'Unique winners',
  mostSelectedItem: 'Most selected item',
  leastSelectedItem: 'Least selected item',
  mostSelectedParent: 'Most selected parent',
  mostSelectedChild: 'Most selected child',
  mostSelectedPath: 'Most selected path',
  none: 'None yet',
  selectionFrequency: 'Selection frequency',
  parentFrequency: 'Parent selection frequency',
  childFrequency: 'Child selection frequency',
  pathFrequency: 'Full path frequency',
  item: 'Item',
  path: 'Path',
  count: 'Count',
  percentage: 'Percentage',
  spinsPerWheel: 'Spins per wheel',
  spinFrequency: 'Daily activity',
  weeklyActivity: 'Weekly activity',
  monthlyActivity: 'Monthly activity',
  winnerDistribution: 'Winner distribution',
  parentVsChild: 'Parent vs child selections',
  parent: 'Parent',
  child: 'Child',
  spins: 'Spins',
  selections: 'Selections',
  frequencyAria: 'Selection frequency',
  parentFrequencyAria: 'Parent selection frequency',
  childFrequencyAria: 'Child selection frequency',
  pathFrequencyAria: 'Full path frequency',
  noChildSelections: 'No child selections yet.',
  dateRange: 'Date range',
  rangeToday: 'Today',
  range7Days: '7 days',
  range30Days: '30 days',
  rangeAll: 'All time',
} as const;

export const STATISTICS_DATE_RANGE = {
  today: 'today',
  days7: '7d',
  days30: '30d',
  all: 'all',
} as const;

export type StatisticsDateRange =
  (typeof STATISTICS_DATE_RANGE)[keyof typeof STATISTICS_DATE_RANGE];

export const STATISTICS_DATE_RANGE_OPTIONS = [
  { value: STATISTICS_DATE_RANGE.today, label: STATISTICS_MESSAGES.rangeToday },
  { value: STATISTICS_DATE_RANGE.days7, label: STATISTICS_MESSAGES.range7Days },
  { value: STATISTICS_DATE_RANGE.days30, label: STATISTICS_MESSAGES.range30Days },
  { value: STATISTICS_DATE_RANGE.all, label: STATISTICS_MESSAGES.rangeAll },
] as const;

export const STATISTICS_CHART_HEIGHT = 280;
export const STATISTICS_TOP_CHART_ITEMS = 8;
export const STATISTICS_MAX_DAILY_SPAN = 90;
export const STATISTICS_MAX_WEEKLY_SPAN = 52;
export const STATISTICS_MAX_MONTHLY_SPAN = 36;
export const STATISTICS_OTHER_LABEL = 'Other';
