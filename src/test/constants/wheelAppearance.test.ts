import {
  DEFAULT_WHEEL_APPEARANCE,
  WHEEL_BORDER_WIDTH_MAX,
  WHEEL_BORDER_WIDTH_MIN,
  WHEEL_FONT_SIZE_MAX,
  WHEEL_FONT_SIZE_MIN,
  WHEEL_SIZE_MAX_WIDTH,
  WHEEL_THEME_LABELS,
  WHEEL_THEME_PRESETS,
  isHexColor,
  normalizeHexColor,
} from '@/constants/wheelAppearance';
import { WHEEL_SIZE, WHEEL_THEME, type HexColor } from '@/types/wheel';

const NAMED_THEMES = [
  WHEEL_THEME.classic,
  WHEEL_THEME.neon,
  WHEEL_THEME.pastel,
  WHEEL_THEME.minimal,
  WHEEL_THEME.dark,
  WHEEL_THEME.rainbow,
] as const;

describe('isHexColor', () => {
  it.each(['#fff', '#FFF', '#4f46e5', '#AABBCC'])('accepts %s', (value) => {
    expect(isHexColor(value)).toBe(true);
  });

  it.each(['', 'fff', '#ff', '#ffff', '#fffffff', '#gggggg', ' #fff', '#fff ', 'rgb(0,0,0)'])(
    'rejects %s',
    (value) => {
      expect(isHexColor(value)).toBe(false);
    },
  );
});

describe('normalizeHexColor', () => {
  const fallback = '#111827' as HexColor;

  it('lowercases a six-digit hex color', () => {
    expect(normalizeHexColor('#AABBCC', fallback)).toBe('#aabbcc');
    expect(normalizeHexColor('  #4F46E5  ', fallback)).toBe('#4f46e5');
  });

  it('expands a three-digit hex color', () => {
    expect(normalizeHexColor('#abc', fallback)).toBe('#aabbcc');
    expect(normalizeHexColor(' #ABC ', fallback)).toBe('#aabbcc');
  });

  it('returns the fallback for invalid values', () => {
    expect(normalizeHexColor('', fallback)).toBe(fallback);
    expect(normalizeHexColor('#ff', fallback)).toBe(fallback);
    expect(normalizeHexColor('#ffff', fallback)).toBe(fallback);
    expect(normalizeHexColor('red', fallback)).toBe(fallback);
  });
});

describe('wheel appearance constants', () => {
  it('uses the classic preset as the default appearance', () => {
    expect(DEFAULT_WHEEL_APPEARANCE.theme).toBe(WHEEL_THEME.classic);
    expect(WHEEL_THEME_PRESETS[WHEEL_THEME.classic]).toBe(DEFAULT_WHEEL_APPEARANCE);
  });

  it('labels every named theme and keeps each preset on its own theme', () => {
    for (const theme of NAMED_THEMES) {
      expect(WHEEL_THEME_LABELS[theme]).toBeTruthy();
      expect(WHEEL_THEME_PRESETS[theme].theme).toBe(theme);
    }
  });

  it('stores valid hex colors on every named theme', () => {
    for (const theme of NAMED_THEMES) {
      const appearance = WHEEL_THEME_PRESETS[theme];

      expect(appearance.segmentColors.length).toBeGreaterThan(0);
      expect(appearance.segmentColors.every(isHexColor)).toBe(true);
      expect(isHexColor(appearance.textColor)).toBe(true);
      expect(isHexColor(appearance.pointerColor)).toBe(true);
      expect(isHexColor(appearance.borderColor)).toBe(true);
      expect(isHexColor(appearance.background)).toBe(true);
      expect(isHexColor(appearance.centerButtonColor)).toBe(true);
      expect(isHexColor(appearance.centerButtonTextColor)).toBe(true);
    }
  });

  it('maps each wheel size to responsive max widths', () => {
    expect(WHEEL_SIZE_MAX_WIDTH[WHEEL_SIZE.sm].md).toBeLessThan(WHEEL_SIZE_MAX_WIDTH[WHEEL_SIZE.md].md);
    expect(WHEEL_SIZE_MAX_WIDTH[WHEEL_SIZE.md].md).toBeLessThan(WHEEL_SIZE_MAX_WIDTH[WHEEL_SIZE.lg].md);
  });

  it('keeps font size and border width ranges ordered', () => {
    expect(WHEEL_FONT_SIZE_MIN).toBeLessThan(WHEEL_FONT_SIZE_MAX);
    expect(WHEEL_BORDER_WIDTH_MIN).toBeLessThan(WHEEL_BORDER_WIDTH_MAX);
  });
});
