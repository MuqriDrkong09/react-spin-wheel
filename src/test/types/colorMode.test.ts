import { COLOR_MODE, COLOR_MODE_CYCLE, isColorMode } from '@/types/colorMode';

describe('colorMode', () => {
  it('exposes light, dark, and system modes', () => {
    expect(COLOR_MODE).toEqual({
      light: 'light',
      dark: 'dark',
      system: 'system',
    });
  });

  it('cycles through light, dark, then system', () => {
    expect(COLOR_MODE_CYCLE).toEqual([COLOR_MODE.light, COLOR_MODE.dark, COLOR_MODE.system]);
  });

  it('accepts known color modes', () => {
    expect(isColorMode(COLOR_MODE.light)).toBe(true);
    expect(isColorMode(COLOR_MODE.dark)).toBe(true);
    expect(isColorMode(COLOR_MODE.system)).toBe(true);
    expect(isColorMode('light')).toBe(true);
    expect(isColorMode('dark')).toBe(true);
    expect(isColorMode('system')).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(isColorMode('auto')).toBe(false);
    expect(isColorMode('')).toBe(false);
    expect(isColorMode(null)).toBe(false);
    expect(isColorMode(undefined)).toBe(false);
    expect(isColorMode(1)).toBe(false);
    expect(isColorMode({})).toBe(false);
  });
});
