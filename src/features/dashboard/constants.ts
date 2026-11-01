export {
  DEFAULT_WHEEL_CATEGORY,
  WHEEL_CATEGORIES,
  type WheelCategory,
} from '@/constants/wheel';

export const CATEGORY_FILTER_ALL = 'all';

export const WHEEL_SORT = {
  nameAsc: 'name-asc',
  createdDesc: 'created-desc',
  updatedDesc: 'updated-desc',
  usedCountDesc: 'used-count-desc',
} as const;

export type WheelSort = (typeof WHEEL_SORT)[keyof typeof WHEEL_SORT];

export const WHEEL_SORT_LABELS: Record<WheelSort, string> = {
  [WHEEL_SORT.nameAsc]: 'Name',
  [WHEEL_SORT.createdDesc]: 'Created date',
  [WHEEL_SORT.updatedDesc]: 'Updated date',
  [WHEEL_SORT.usedCountDesc]: 'Most used',
};

export const SEARCH_DEBOUNCE_MS = 250;

export const DASHBOARD_LIST_LIMIT = 5;

export const FAVORITE_FILTER = {
  all: 'all',
  favorites: 'favorites',
} as const;

export type FavoriteFilter = (typeof FAVORITE_FILTER)[keyof typeof FAVORITE_FILTER];

export const FAVORITE_FILTER_LABELS: Record<FavoriteFilter, string> = {
  [FAVORITE_FILTER.all]: 'All wheels',
  [FAVORITE_FILTER.favorites]: 'Favorites only',
};

export function isWheelSort(value: string): value is WheelSort {
  return Object.values(WHEEL_SORT).some((sort) => sort === value);
}

export function isFavoriteFilter(value: string): value is FavoriteFilter {
  return Object.values(FAVORITE_FILTER).some((filter) => filter === value);
}

export const USAGE_FILTER = {
  all: 'all',
  recent: 'recent',
} as const;

export type UsageFilter = (typeof USAGE_FILTER)[keyof typeof USAGE_FILTER];

export const USAGE_FILTER_LABELS: Record<UsageFilter, string> = {
  [USAGE_FILTER.all]: 'All wheels',
  [USAGE_FILTER.recent]: 'Recently used',
};

export function isUsageFilter(value: string): value is UsageFilter {
  return Object.values(USAGE_FILTER).some((filter) => filter === value);
}
