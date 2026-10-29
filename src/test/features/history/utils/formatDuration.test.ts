import { formatDuration } from '@/features/history/utils/formatDuration';

describe('formatDuration', () => {
  it('formats milliseconds, seconds, and minutes', () => {
    expect(formatDuration(240)).toBe('240ms');
    expect(formatDuration(4200)).toBe('4.2s');
    expect(formatDuration(12000)).toBe('12s');
    expect(formatDuration(65_000)).toBe('1m 5s');
  });

  it('treats invalid values as zero', () => {
    expect(formatDuration(-8)).toBe('0s');
    expect(formatDuration(Number.NaN)).toBe('0s');
  });
});
