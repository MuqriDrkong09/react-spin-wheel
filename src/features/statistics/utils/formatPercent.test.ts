import { formatPercent, formatTimes } from '@/features/statistics/utils/formatPercent';

describe('formatPercent', () => {
  it('formats whole and fractional percentages', () => {
    expect(formatPercent(50)).toBe('50%');
    expect(formatPercent(33.333)).toBe('33.3%');
  });
});

describe('formatTimes', () => {
  it('uses a singular label for one selection', () => {
    expect(formatTimes(1)).toBe('1 time');
    expect(formatTimes(2)).toBe('2 times');
  });
});
