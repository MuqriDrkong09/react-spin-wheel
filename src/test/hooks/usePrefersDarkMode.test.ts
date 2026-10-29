import { act, renderHook } from '@testing-library/react';

import { COLOR_SCHEME_QUERY } from '@/constants/colorMode';
import { usePrefersDarkMode } from '@/hooks/usePrefersDarkMode';

function stubColorScheme(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  window.matchMedia = (query: string): MediaQueryList => ({
    matches: query === COLOR_SCHEME_QUERY ? matches : false,
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
      const event = { matches: next, media: COLOR_SCHEME_QUERY } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
    listenerCount: () => listeners.size,
  };
}

describe('usePrefersDarkMode', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('starts from the current color scheme and tracks changes', () => {
    const media = stubColorScheme(true);
    const { result } = renderHook(() => usePrefersDarkMode());

    expect(result.current).toBe(true);

    act(() => {
      media.setMatches(false);
    });

    expect(result.current).toBe(false);
  });

  it('removes the media listener on unmount', () => {
    const media = stubColorScheme(false);
    const { result, unmount } = renderHook(() => usePrefersDarkMode());

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

    const { result } = renderHook(() => usePrefersDarkMode());

    expect(result.current).toBe(false);
  });
});
