import { act, renderHook } from '@testing-library/react';

import { REDUCED_MOTION_QUERY } from '@/constants/motion';
import { getPrefersReducedMotion, usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

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
    listenerCount: () => listeners.size,
  };
}

describe('getPrefersReducedMotion', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (typeof window !== 'undefined') {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('reads prefers-reduced-motion from matchMedia', () => {
    stubReducedMotion(true);
    expect(getPrefersReducedMotion()).toBe(true);

    stubReducedMotion(false);
    expect(getPrefersReducedMotion()).toBe(false);
  });

  it('treats a missing matchMedia as motion enabled', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    expect(getPrefersReducedMotion()).toBe(false);
  });

  it('treats a missing window as motion enabled', () => {
    vi.stubGlobal('window', undefined);

    expect(getPrefersReducedMotion()).toBe(false);
  });
});

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

  it('removes the media listener on unmount', () => {
    const media = stubReducedMotion(false);
    const { result, unmount } = renderHook(() => usePrefersReducedMotion());

    expect(media.listenerCount()).toBe(1);
    unmount();
    expect(media.listenerCount()).toBe(0);

    act(() => {
      media.setMatches(true);
    });
    expect(result.current).toBe(false);
  });

  it('skips listening when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });
});
