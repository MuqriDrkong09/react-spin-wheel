import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';

describe('formatDateTime', () => {
  it('formats valid ISO dates', () => {
    expect(formatDateTime('2026-01-02T00:00:00.000Z')).toBe(
      new Date('2026-01-02T00:00:00.000Z').toLocaleString(),
    );
  });

  it('returns the original value for invalid dates', () => {
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
  });
});
