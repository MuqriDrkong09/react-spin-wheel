import { act, renderHook } from '@testing-library/react';

import { COLOR_SCHEME_QUERY } from '@/constants/colorMode';
import { useColorMode } from '@/hooks/useColorMode';
import { resetAppStore, useAppStore } from '@/stores/appStore';
import { COLOR_MODE } from '@/types/colorMode';

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
  };
}

describe('useColorMode', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    resetAppStore();
    window.matchMedia = originalMatchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('resolves system preference to the current color scheme', () => {
    stubColorScheme(true);
    const { result } = renderHook(() => useColorMode());

    expect(result.current.colorMode).toBe(COLOR_MODE.system);
    expect(result.current.resolvedMode).toBe('dark');
  });

  it('updates the resolved theme when the system color scheme changes', () => {
    const scheme = stubColorScheme(false);
    const { result } = renderHook(() => useColorMode());

    expect(result.current.resolvedMode).toBe('light');

    act(() => {
      scheme.setMatches(true);
    });

    expect(result.current.resolvedMode).toBe('dark');
  });

  it('keeps an explicit dark preference when the system scheme is light', () => {
    stubColorScheme(false);
    useAppStore.getState().setColorMode(COLOR_MODE.dark);
    const { result } = renderHook(() => useColorMode());

    expect(result.current.resolvedMode).toBe('dark');
  });
});
