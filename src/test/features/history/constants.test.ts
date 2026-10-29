import {
  HISTORY_FILTER_ALL,
  HISTORY_MODE_LABELS,
  HISTORY_PAGE_SIZE,
  HISTORY_PAGE_SIZE_OPTIONS,
  HISTORY_SORT,
  HISTORY_SORT_LABELS,
  isHistoryModeFilter,
  isHistorySort,
} from '@/features/history/constants';
import { SELECTION_MODE } from '@/types/wheel';

describe('isHistorySort', () => {
  it.each(Object.values(HISTORY_SORT))('accepts %s', (value) => {
    expect(isHistorySort(value)).toBe(true);
  });

  it.each(['', 'newest-first', 'name-asc', HISTORY_FILTER_ALL])('rejects %s', (value) => {
    expect(isHistorySort(value)).toBe(false);
  });
});

describe('isHistoryModeFilter', () => {
  it.each([HISTORY_FILTER_ALL, SELECTION_MODE.manual, SELECTION_MODE.automatic, SELECTION_MODE.ask])(
    'accepts %s',
    (value) => {
      expect(isHistoryModeFilter(value)).toBe(true);
    },
  );

  it.each(['', 'random', HISTORY_SORT.newest])('rejects %s', (value) => {
    expect(isHistoryModeFilter(value)).toBe(false);
  });
});

describe('history constant maps', () => {
  it('labels every sort option', () => {
    for (const sort of Object.values(HISTORY_SORT)) {
      expect(HISTORY_SORT_LABELS[sort]).toBeTruthy();
    }
  });

  it('labels every selection mode', () => {
    for (const mode of Object.values(SELECTION_MODE)) {
      expect(HISTORY_MODE_LABELS[mode]).toBeTruthy();
    }
  });

  it('includes the default page size in the page-size options', () => {
    expect(HISTORY_PAGE_SIZE_OPTIONS).toContain(HISTORY_PAGE_SIZE);
    expect(HISTORY_PAGE_SIZE_OPTIONS).toEqual([...HISTORY_PAGE_SIZE_OPTIONS].sort((left, right) => left - right));
  });
});
