import {
  FAVORITE_FILTER,
  USAGE_FILTER,
  WHEEL_SORT,
  isFavoriteFilter,
  isUsageFilter,
  isWheelSort,
} from '@/features/dashboard/constants';

describe('dashboard constants', () => {
  it('accepts known wheel sorts, favorite filters, and usage filters', () => {
    expect(isWheelSort(WHEEL_SORT.nameAsc)).toBe(true);
    expect(isWheelSort(WHEEL_SORT.createdDesc)).toBe(true);
    expect(isWheelSort(WHEEL_SORT.usedCountDesc)).toBe(true);
    expect(isWheelSort('random')).toBe(false);
    expect(isFavoriteFilter(FAVORITE_FILTER.all)).toBe(true);
    expect(isFavoriteFilter(FAVORITE_FILTER.favorites)).toBe(true);
    expect(isFavoriteFilter('starred')).toBe(false);
    expect(isUsageFilter(USAGE_FILTER.all)).toBe(true);
    expect(isUsageFilter(USAGE_FILTER.recent)).toBe(true);
    expect(isUsageFilter('latest')).toBe(false);
  });
});
