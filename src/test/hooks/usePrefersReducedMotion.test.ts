import { act, renderHook } from '@testing-library/react';

import { REDUCED_MOTION_QUERY } from '@/constants/motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

function stubReducedMotion(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  window.matchMedia = (query: string): MediaQueryList => ({
    matches: query === REDUCED_MOTION_QUERY ? matches : false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: (_event, listener) => {
      listeners.add(listener as (event: MediaQueryListEvent) => void);
    },
    removeEventListener: (_event, listener) => {
      listeners.delete(listener as (event: MediaQueryListEvent) => void);
    },
    dispatchEvent: (event) => {
      listeners.forEach((listener) => listener(event as MediaQueryListEvent));
      return true;
    },
  });

  return {
    setMatches(next: boolean) {
      matches = next;
      const event = { matches: next, media: REDUCED_MOTION_QUERY } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

describe('usePrefersReducedMotion', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('tracks prefers-reduced-motion changes', () => {
    const media = stubReducedMotion(false);
    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      media.setMatches(true);
    });

    expect(result.current).toBe(true);
  });
});
