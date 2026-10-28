import { DEFAULT_WHEEL_APPEARANCE, WHEEL_THEME_PRESETS } from '@/constants/wheelAppearance';
import {
  appearanceFromTheme,
  displayWheelTitle,
  mergeAppearance,
  resolveAppearance,
  segmentColorAt,
} from '@/features/wheel-customization/utils/appearance';
import { WHEEL_SIZE, WHEEL_THEME } from '@/types/wheel';

describe('resolveAppearance', () => {
  it('fills missing appearance with classic defaults', () => {
    expect(resolveAppearance()).toEqual(DEFAULT_WHEEL_APPEARANCE);
    expect(resolveAppearance({})).toEqual(DEFAULT_WHEEL_APPEARANCE);
  });

  it('keeps valid custom values and clamps ranges', () => {
    const appearance = resolveAppearance({
      title: 'Dinner',
      size: WHEEL_SIZE.lg,
      theme: WHEEL_THEME.custom,
      textColor: '#abc',
      borderWidth: 99,
      fontSize: 3,
      fontWeight: 500,
      segmentColors: ['#ff0000', 'nope'],
    });

    expect(appearance.title).toBe('Dinner');
    expect(appearance.size).toBe(WHEEL_SIZE.lg);
    expect(appearance.textColor).toBe('#aabbcc');
    expect(appearance.borderWidth).toBe(8);
    expect(appearance.fontSize).toBe(10);
    expect(appearance.fontWeight).toBe(600);
    expect(appearance.segmentColors).toEqual(['#ff0000']);
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
  });
});

describe('display helpers', () => {
  it('falls back to the wheel name when the custom title is blank', () => {
    expect(displayWheelTitle(DEFAULT_WHEEL_APPEARANCE, 'Pizza Night')).toBe('Pizza Night');
    expect(displayWheelTitle({ ...DEFAULT_WHEEL_APPEARANCE, title: '  Dinner  ' }, 'Pizza Night')).toBe(
      'Dinner',
    );
  });

  it('cycles segment colors and falls back when the palette is empty', () => {
    const appearance = resolveAppearance({
      segmentColors: ['#ef4444', '#22c55e'],
    });

    expect(segmentColorAt(appearance, 0, '#000000')).toBe('#ef4444');
    expect(segmentColorAt(appearance, 2, '#000000')).toBe('#ef4444');
    expect(segmentColorAt({ ...appearance, segmentColors: [] }, 0, '#111827')).toBe('#111827');
  });
});
