import { SELECTION_MODE, type SelectionMode } from '@/types/wheel';

export const HISTORY_MESSAGES = {
  title: 'History',
  description: 'Review past spin results.',
  searchLabel: 'Search results',
  searchPlaceholder: 'Search by path or wheel',
  wheelFilter: 'Wheel',
  allWheels: 'All wheels',
  modeFilter: 'Mode',
  allModes: 'All modes',
  sort: 'Sort',
  emptyTitle: 'No spin history yet',
  emptyDescription: 'Finish a selection to save it here.',
  noMatchesTitle: 'No matching results',
  noMatchesDescription: 'Try a different search, wheel, or sort order.',
  clearHistory: 'Clear history',
  clearHistoryTitle: 'Clear history',
  clearHistoryDescription: 'Delete every saved spin result? This cannot be undone.',
  deleteResult: 'Delete result',
  deleteResultTitle: 'Delete result',
  deleteResultDescription: 'Delete this spin result? This cannot be undone.',
  viewDetails: 'View details',
  detailsTitle: 'Spin result',
  path: 'Path',
  wheel: 'Wheel',
  selectedItem: 'Selected item',
  timestamp: 'Timestamp',
  duration: 'Duration',
  mode: 'Mode',
  session: 'Session',
  close: 'Close',
  cancel: 'Cancel',
  delete: 'Delete',
  resultsAria: 'Spin history',
} as const;

export const HISTORY_FILTER_ALL = 'all';

export const HISTORY_SORT = {
  newest: 'newest',
  oldest: 'oldest',
  wheelName: 'wheel-name',
  duration: 'duration',
} as const;

export type HistorySort = (typeof HISTORY_SORT)[keyof typeof HISTORY_SORT];

export const HISTORY_SORT_LABELS: Record<HistorySort, string> = {
  [HISTORY_SORT.newest]: 'Newest first',
  [HISTORY_SORT.oldest]: 'Oldest first',
  [HISTORY_SORT.wheelName]: 'Wheel name',
  [HISTORY_SORT.duration]: 'Longest duration',
};

export const HISTORY_MODE_LABELS: Record<SelectionMode, string> = {
  [SELECTION_MODE.manual]: 'Manual',
  [SELECTION_MODE.automatic]: 'Automatic',
  [SELECTION_MODE.ask]: 'Ask',
};

export const HISTORY_PAGE_SIZE = 10;
export const HISTORY_PAGE_SIZE_OPTIONS = [10, 25, 50];

export function isHistorySort(value: string): value is HistorySort {
  return Object.values(HISTORY_SORT).some((sort) => sort === value);
}

export function isHistoryModeFilter(value: string): value is SelectionMode | typeof HISTORY_FILTER_ALL {
  return (
    value === HISTORY_FILTER_ALL ||
    value === SELECTION_MODE.manual ||
    value === SELECTION_MODE.automatic ||
    value === SELECTION_MODE.ask
  );
}
