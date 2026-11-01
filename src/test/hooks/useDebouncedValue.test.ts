import { act, renderHook } from '@testing-library/react';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('returns the current value after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delayMs }: { value: string; delayMs: number }) => useDebouncedValue(value, delayMs),
      { initialProps: { value: 'a', delayMs: 250 } },
    );

    expect(result.current).toBe('a');

    rerender({ value: 'ab', delayMs: 250 });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(249);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('ab');
  });

  it('restarts the delay when the value changes', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebouncedValue(value, 250), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'abc' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe('abc');
  });
});
