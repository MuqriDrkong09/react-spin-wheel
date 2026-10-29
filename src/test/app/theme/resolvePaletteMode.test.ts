import { COLOR_SCHEME_QUERY } from '@/constants/colorMode';
import { COLOR_MODE } from '@/types/colorMode';

import { getPrefersDarkMode, resolvePaletteMode } from '@/app/theme/resolvePaletteMode';

function stubMatchMedia(matches: boolean) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: query === COLOR_SCHEME_QUERY ? matches : false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

describe('resolvePaletteMode', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (typeof window !== 'undefined') {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('keeps explicit light and dark preferences', () => {
    expect(resolvePaletteMode(COLOR_MODE.light, true)).toBe('light');
    expect(resolvePaletteMode(COLOR_MODE.dark, false)).toBe('dark');
  });

  it('follows prefers-color-scheme when the preference is system', () => {
    expect(resolvePaletteMode(COLOR_MODE.system, false)).toBe('light');
    expect(resolvePaletteMode(COLOR_MODE.system, true)).toBe('dark');
  });

  it('reads the system color scheme when no override is passed', () => {
    stubMatchMedia(true);
    expect(getPrefersDarkMode()).toBe(true);
    expect(resolvePaletteMode(COLOR_MODE.system)).toBe('dark');
    expect(resolvePaletteMode(COLOR_MODE.light)).toBe('light');

    stubMatchMedia(false);
    expect(getPrefersDarkMode()).toBe(false);
    expect(resolvePaletteMode(COLOR_MODE.system)).toBe('light');
    expect(resolvePaletteMode(COLOR_MODE.dark)).toBe('dark');
  });

  it('treats a missing matchMedia as light', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    expect(getPrefersDarkMode()).toBe(false);
    expect(resolvePaletteMode(COLOR_MODE.system)).toBe('light');
  });

  it('treats a missing window as light', () => {
    vi.stubGlobal('window', undefined);

    expect(getPrefersDarkMode()).toBe(false);
  });
});
