import { CENTER_BUTTON_STYLE, WHEEL_SIZE, WHEEL_THEME, type HexColor } from '@/types/wheel';
import { DEFAULT_WHEEL_APPEARANCE, WHEEL_THEME_PRESETS } from '@/constants/wheelAppearance';
import {
  appearanceFromTheme,
  displayWheelTitle,
  isAppearanceInput,
  isCenterButtonStyle,
  isNamedWheelTheme,
  isWheelSize,
  isWheelTheme,
  matchingTheme,
  mergeAppearance,
  resolveAppearance,
  segmentColorAt,
} from '@/features/wheel-customization/utils/appearance';

describe('appearance guards', () => {
  it('recognizes wheel themes, sizes, and hub styles', () => {
    expect(isWheelTheme(WHEEL_THEME.classic)).toBe(true);
    expect(isWheelTheme(WHEEL_THEME.custom)).toBe(true);
    expect(isWheelTheme('nope')).toBe(false);
    expect(isWheelTheme(undefined)).toBe(false);

    expect(isNamedWheelTheme(WHEEL_THEME.neon)).toBe(true);
    expect(isNamedWheelTheme(WHEEL_THEME.custom)).toBe(false);
    expect(isNamedWheelTheme('nope')).toBe(false);

    expect(isWheelSize(WHEEL_SIZE.sm)).toBe(true);
    expect(isWheelSize('xl')).toBe(false);
    expect(isCenterButtonStyle(CENTER_BUTTON_STYLE.ghost)).toBe(true);
    expect(isCenterButtonStyle('solid')).toBe(false);
  });

  it('accepts plain objects as appearance input', () => {
    expect(isAppearanceInput({ title: 'Dinner' })).toBe(true);
    expect(isAppearanceInput(null)).toBe(false);
    expect(isAppearanceInput([])).toBe(false);
    expect(isAppearanceInput('classic')).toBe(false);
  });
});

describe('resolveAppearance', () => {
  it('fills missing appearance with classic defaults', () => {
    expect(resolveAppearance()).toEqual(DEFAULT_WHEEL_APPEARANCE);
    expect(resolveAppearance(null)).toEqual(DEFAULT_WHEEL_APPEARANCE);
    expect(resolveAppearance({})).toEqual(DEFAULT_WHEEL_APPEARANCE);
  });

  it('keeps valid custom values and clamps ranges', () => {
    const appearance = resolveAppearance({
      title: 'Dinner',
      size: WHEEL_SIZE.lg,
      theme: WHEEL_THEME.custom,
      textColor: '#abc',
      pointerColor: '',
      borderWidth: 99,
      borderColor: 'nope',
      fontSize: 3,
      fontWeight: 500,
      background: undefined,
      segmentColors: ['#ff0000', 'nope'],
      centerButtonStyle: CENTER_BUTTON_STYLE.ghost,
      centerButtonColor: '#123',
      centerButtonTextColor: '#fff',
    });

    expect(appearance.title).toBe('Dinner');
    expect(appearance.size).toBe(WHEEL_SIZE.lg);
    expect(appearance.theme).toBe(WHEEL_THEME.custom);
    expect(appearance.textColor).toBe('#aabbcc');
    expect(appearance.pointerColor).toBe(DEFAULT_WHEEL_APPEARANCE.pointerColor);
    expect(appearance.borderWidth).toBe(8);
    expect(appearance.borderColor).toBe(DEFAULT_WHEEL_APPEARANCE.borderColor);
    expect(appearance.fontSize).toBe(10);
    expect(appearance.fontWeight).toBe(600);
    expect(appearance.background).toBe(DEFAULT_WHEEL_APPEARANCE.background);
    expect(appearance.segmentColors).toEqual(['#ff0000']);
    expect(appearance.centerButtonStyle).toBe(CENTER_BUTTON_STYLE.ghost);
    expect(appearance.centerButtonColor).toBe('#112233');
    expect(appearance.centerButtonTextColor).toBe('#ffffff');
  });

  it('falls back for invalid enums, empty palettes, and non-finite sizes', () => {
    const appearance = resolveAppearance({
      size: 'xl' as never,
      theme: 'nope' as never,
      segmentColors: ['nope'],
      borderWidth: Number.NaN,
      fontSize: Number.POSITIVE_INFINITY,
      fontWeight: 800,
      centerButtonStyle: 'solid' as never,
    });

    expect(appearance.size).toBe(DEFAULT_WHEEL_APPEARANCE.size);
    expect(appearance.theme).toBe(DEFAULT_WHEEL_APPEARANCE.theme);
    expect(appearance.segmentColors).toEqual(DEFAULT_WHEEL_APPEARANCE.segmentColors);
    expect(appearance.borderWidth).toBe(0);
    expect(appearance.fontSize).toBe(10);
    expect(appearance.fontWeight).toBe(700);
    expect(appearance.centerButtonStyle).toBe(DEFAULT_WHEEL_APPEARANCE.centerButtonStyle);
  });

  it('snaps font weight to the nearest allowed value', () => {
    expect(resolveAppearance({ fontWeight: 400 }).fontWeight).toBe(400);
    expect(resolveAppearance({ fontWeight: 600 }).fontWeight).toBe(600);
    expect(resolveAppearance({ fontWeight: 700 }).fontWeight).toBe(700);
    expect(resolveAppearance({ fontWeight: 200 }).fontWeight).toBe(400);
    expect(resolveAppearance({ fontWeight: 1.6 }).fontWeight).toBe(400);
    expect(resolveAppearance({ borderWidth: 1.4 }).borderWidth).toBe(1);
  });
});

describe('mergeAppearance', () => {
  it('applies a named theme without clearing the title', () => {
    const appearance = mergeAppearance(
      { title: 'Pizza Night', size: WHEEL_SIZE.lg },
      appearanceFromTheme(WHEEL_THEME.neon, { title: 'Pizza Night', size: WHEEL_SIZE.lg }),
    );

    expect(appearance.theme).toBe(WHEEL_THEME.neon);
    expect(appearance.pointerColor).toBe(WHEEL_THEME_PRESETS.neon.pointerColor);
    expect(appearance.title).toBe('Pizza Night');
    expect(appearance.size).toBe(WHEEL_SIZE.lg);
  });

  it('marks edited colors as custom unless they still match a preset', () => {
    const custom = mergeAppearance(DEFAULT_WHEEL_APPEARANCE, { pointerColor: '#111111' });
    expect(custom.theme).toBe(WHEEL_THEME.custom);

    const stillClassic = mergeAppearance(DEFAULT_WHEEL_APPEARANCE, { size: WHEEL_SIZE.lg });
    expect(stillClassic.theme).toBe(WHEEL_THEME.classic);
    expect(stillClassic.size).toBe(WHEEL_SIZE.lg);

    const customThemePatch = mergeAppearance(DEFAULT_WHEEL_APPEARANCE, { theme: WHEEL_THEME.custom });
    expect(customThemePatch.theme).toBe(WHEEL_THEME.classic);
  });

  it('resolves a missing current appearance from the patch alone', () => {
    const appearance = mergeAppearance(undefined, { title: 'Dinner' });

    expect(appearance.title).toBe('Dinner');
    expect(appearance.theme).toBe(WHEEL_THEME.classic);
  });
});

describe('theme helpers', () => {
  it('builds a preset appearance and keeps title and size when provided', () => {
    const fromPreset = appearanceFromTheme(WHEEL_THEME.pastel);
    expect(fromPreset.theme).toBe(WHEEL_THEME.pastel);
    expect(fromPreset.title).toBe('');
    expect(fromPreset.size).toBe(WHEEL_THEME_PRESETS.pastel.size);
    expect(fromPreset.segmentColors).toEqual(WHEEL_THEME_PRESETS.pastel.segmentColors);
    expect(fromPreset.segmentColors).not.toBe(WHEEL_THEME_PRESETS.pastel.segmentColors);

    const withCurrent = appearanceFromTheme(WHEEL_THEME.dark, {
      title: 'Dinner',
      size: WHEEL_SIZE.sm,
    });
    expect(withCurrent.title).toBe('Dinner');
    expect(withCurrent.size).toBe(WHEEL_SIZE.sm);
  });

  it('matches a preset from visuals and skips mismatched palettes', () => {
    expect(matchingTheme(DEFAULT_WHEEL_APPEARANCE)).toBe(WHEEL_THEME.classic);
    expect(matchingTheme({ ...DEFAULT_WHEEL_APPEARANCE, segmentColors: ['#111111'] })).toBeUndefined();
  });
});

describe('display helpers', () => {
  it('falls back to the wheel name when the custom title is blank', () => {
    expect(displayWheelTitle(DEFAULT_WHEEL_APPEARANCE, 'Pizza Night')).toBe('Pizza Night');
    expect(displayWheelTitle({ ...DEFAULT_WHEEL_APPEARANCE, title: '  Dinner  ' }, 'Pizza Night')).toBe(
      'Dinner',
    );
  });

  it('cycles segment colors and falls back when a slot is missing', () => {
    const appearance = resolveAppearance({
      segmentColors: ['#ef4444', '#22c55e'],
    });

    expect(segmentColorAt(appearance, 0, '#000000')).toBe('#ef4444');
    expect(segmentColorAt(appearance, 2, '#000000')).toBe('#ef4444');
    expect(segmentColorAt({ ...appearance, segmentColors: [] }, 0, '#111827')).toBe('#111827');
    expect(
      segmentColorAt(
        { ...appearance, segmentColors: [undefined as unknown as HexColor] },
        0,
        '#111827',
      ),
    ).toBe('#111827');
  });
});
