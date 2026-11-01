export {
  DEFAULT_WHEEL_CATEGORY,
  WHEEL_CATEGORIES,
  type WheelCategory,
} from '@/constants/wheel';

export const CATEGORY_FILTER_ALL = 'all';

export const WHEEL_SORT = {
  nameAsc: 'name-asc',
  nameDesc: 'name-desc',
  updatedDesc: 'updated-desc',
  usedDesc: 'used-desc',
} as const;

export type WheelSort = (typeof WHEEL_SORT)[keyof typeof WHEEL_SORT];

export const WHEEL_SORT_LABELS: Record<WheelSort, string> = {
  [WHEEL_SORT.nameAsc]: 'Name A-Z',
  [WHEEL_SORT.nameDesc]: 'Name Z-A',
  [WHEEL_SORT.updatedDesc]: 'Recently updated',
  [WHEEL_SORT.usedDesc]: 'Recently used',
};

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
