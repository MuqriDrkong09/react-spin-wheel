import { COLOR_SCHEME_QUERY } from '@/constants/colorMode';
import { COLOR_MODE, type ColorMode } from '@/types/colorMode';
import type { PaletteMode } from '@mui/material';

export function getPrefersDarkMode(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(COLOR_SCHEME_QUERY).matches;
}

export function resolvePaletteMode(
  colorMode: ColorMode,
  prefersDark = getPrefersDarkMode(),
): PaletteMode {
  if (colorMode === COLOR_MODE.light) {
    return 'light';
  }

  if (colorMode === COLOR_MODE.dark) {
    return 'dark';
  }

  return prefersDark ? 'dark' : 'light';
}
