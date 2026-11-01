import {
  FAVORITE_FILTER,
  WHEEL_SORT,
  isFavoriteFilter,
  isWheelSort,
} from '@/features/dashboard/constants';

describe('dashboard constants', () => {
  it('accepts known wheel sorts and favorite filters', () => {
    expect(isWheelSort(WHEEL_SORT.nameAsc)).toBe(true);
    expect(isWheelSort('random')).toBe(false);
    expect(isFavoriteFilter(FAVORITE_FILTER.all)).toBe(true);
    expect(isFavoriteFilter(FAVORITE_FILTER.favorites)).toBe(true);
    expect(isFavoriteFilter('starred')).toBe(false);
  });
});
