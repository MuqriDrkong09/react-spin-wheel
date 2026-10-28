import { COLOR_MODE } from '@/types/colorMode';

import { resolvePaletteMode } from './resolvePaletteMode';

describe('resolvePaletteMode', () => {
  it('keeps explicit light and dark preferences', () => {
    expect(resolvePaletteMode(COLOR_MODE.light, true)).toBe('light');
    expect(resolvePaletteMode(COLOR_MODE.dark, false)).toBe('dark');
  });

  it('follows prefers-color-scheme when the preference is system', () => {
    expect(resolvePaletteMode(COLOR_MODE.system, false)).toBe('light');
    expect(resolvePaletteMode(COLOR_MODE.system, true)).toBe('dark');
  });
});
