export const WHEEL_CATEGORIES = ['General', 'Food', 'Games', 'Decisions', 'Custom'] as const;

export type WheelCategory = (typeof WHEEL_CATEGORIES)[number];

export const DEFAULT_WHEEL_CATEGORY: WheelCategory = 'General';

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

export function isWheelSort(value: string): value is WheelSort {
  return Object.values(WHEEL_SORT).some((sort) => sort === value);
}
