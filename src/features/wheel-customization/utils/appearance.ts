import {
  DEFAULT_WHEEL_APPEARANCE,
  WHEEL_BORDER_WIDTH_MAX,
  WHEEL_BORDER_WIDTH_MIN,
  WHEEL_FONT_SIZE_MAX,
  WHEEL_FONT_SIZE_MIN,
  WHEEL_THEME_PRESETS,
  isHexColor,
  normalizeHexColor,
} from '@/constants/wheelAppearance';
import {
  CENTER_BUTTON_STYLE,
  WHEEL_SIZE,
  WHEEL_THEME,
  type CenterButtonStyle,
  type HexColor,
  type WheelAppearance,
  type WheelFontWeight,
  type WheelSize,
  type WheelTheme,
} from '@/types/wheel';

const VISUAL_KEYS = [
  'segmentColors',
  'textColor',
  'pointerColor',
  'borderWidth',
  'borderColor',
  'fontSize',
  'fontWeight',
  'background',
  'centerButtonStyle',
  'centerButtonColor',
  'centerButtonTextColor',
] as const satisfies readonly (keyof WheelAppearance)[];

export function isWheelTheme(value: string | undefined): value is WheelTheme {
  return Object.values(WHEEL_THEME).some((theme) => theme === value);
}

export function isNamedWheelTheme(
  value: string | undefined,
): value is Exclude<WheelTheme, 'custom'> {
  return isWheelTheme(value) && value !== WHEEL_THEME.custom;
}

export function isWheelSize(value: string | undefined): value is WheelSize {
  return Object.values(WHEEL_SIZE).some((size) => size === value);
}

export function isCenterButtonStyle(value: string | undefined): value is CenterButtonStyle {
  return Object.values(CENTER_BUTTON_STYLE).some((style) => style === value);
}

export function isAppearanceInput(value: unknown): value is Partial<WheelAppearance> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function resolveAppearance(appearance?: Partial<WheelAppearance> | null): WheelAppearance {
  const segmentColors = (appearance?.segmentColors ?? [])
    .filter(isHexColor)
    .map((color) => normalizeHexColor(color, color));

  const resolved: WheelAppearance = {
    title: appearance?.title ?? DEFAULT_WHEEL_APPEARANCE.title,
    size: isWheelSize(appearance?.size) ? appearance.size : DEFAULT_WHEEL_APPEARANCE.size,
    theme: isWheelTheme(appearance?.theme) ? appearance.theme : DEFAULT_WHEEL_APPEARANCE.theme,
    segmentColors:
      segmentColors.length > 0 ? segmentColors : [...DEFAULT_WHEEL_APPEARANCE.segmentColors],
    textColor: normalizeHex(appearance?.textColor, DEFAULT_WHEEL_APPEARANCE.textColor),
    pointerColor: normalizeHex(appearance?.pointerColor, DEFAULT_WHEEL_APPEARANCE.pointerColor),
    borderWidth: clamp(
      appearance?.borderWidth ?? DEFAULT_WHEEL_APPEARANCE.borderWidth,
      WHEEL_BORDER_WIDTH_MIN,
      WHEEL_BORDER_WIDTH_MAX,
    ),
    borderColor: normalizeHex(appearance?.borderColor, DEFAULT_WHEEL_APPEARANCE.borderColor),
    fontSize: clamp(
      appearance?.fontSize ?? DEFAULT_WHEEL_APPEARANCE.fontSize,
      WHEEL_FONT_SIZE_MIN,
      WHEEL_FONT_SIZE_MAX,
    ),
    fontWeight: normalizeFontWeight(appearance?.fontWeight),
    background: normalizeHex(appearance?.background, DEFAULT_WHEEL_APPEARANCE.background),
    centerButtonStyle: isCenterButtonStyle(appearance?.centerButtonStyle)
      ? appearance.centerButtonStyle
      : DEFAULT_WHEEL_APPEARANCE.centerButtonStyle,
    centerButtonColor: normalizeHex(
      appearance?.centerButtonColor,
      DEFAULT_WHEEL_APPEARANCE.centerButtonColor,
    ),
    centerButtonTextColor: normalizeHex(
      appearance?.centerButtonTextColor,
      DEFAULT_WHEEL_APPEARANCE.centerButtonTextColor,
    ),
  };

  return resolved;
}

export function mergeAppearance(
  current: Partial<WheelAppearance> | undefined,
  patch?: Partial<WheelAppearance>,
): WheelAppearance {
  const merged = resolveAppearance({ ...current, ...patch });
  const theme =
    patch?.theme && patch.theme !== WHEEL_THEME.custom
      ? patch.theme
      : (matchingTheme(merged) ?? WHEEL_THEME.custom);

  return { ...merged, theme };
}

export function appearanceFromTheme(
  theme: Exclude<WheelTheme, 'custom'>,
  current?: Pick<WheelAppearance, 'title' | 'size'>,
): WheelAppearance {
  const preset = WHEEL_THEME_PRESETS[theme];
  return {
    ...preset,
    title: current?.title ?? '',
    size: current?.size ?? preset.size,
    segmentColors: [...preset.segmentColors],
  };
}

export function matchingTheme(
  appearance: WheelAppearance,
): Exclude<WheelTheme, 'custom'> | undefined {
  return (Object.keys(WHEEL_THEME_PRESETS) as Exclude<WheelTheme, 'custom'>[]).find((theme) =>
    visualsMatch(appearance, WHEEL_THEME_PRESETS[theme]),
  );
}

export function displayWheelTitle(appearance: WheelAppearance, wheelName: string): string {
  const title = appearance.title.trim();
  return title.length > 0 ? title : wheelName;
}

export function segmentColorAt(appearance: WheelAppearance, index: number, fallback: HexColor): HexColor {
  const colors = appearance.segmentColors;
  if (colors.length === 0) {
    return fallback;
  }

  return colors[index % colors.length] ?? fallback;
}

function normalizeHex(value: string | undefined, fallback: HexColor): HexColor {
  return value ? normalizeHexColor(value, fallback) : fallback;
}

function normalizeFontWeight(value: number | undefined): WheelFontWeight {
  if (value === 400 || value === 600 || value === 700) {
    return value;
  }

  if ((value ?? 600) >= 700) {
    return 700;
  }

  if ((value ?? 600) <= 400) {
    return 400;
  }

  return 600;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function visualsMatch(left: WheelAppearance, right: WheelAppearance): boolean {
  return VISUAL_KEYS.every((key) => {
    if (key === 'segmentColors') {
      return left.segmentColors.join() === right.segmentColors.join();
    }

    return left[key] === right[key];
  });
}
