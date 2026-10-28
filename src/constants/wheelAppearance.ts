import {
  CENTER_BUTTON_STYLE,
  WHEEL_SIZE,
  WHEEL_THEME,
  type HexColor,
  type WheelAppearance,
  type WheelTheme,
} from '@/types/wheel';

export const WHEEL_THEME_LABELS: Record<Exclude<WheelTheme, 'custom'>, string> = {
  [WHEEL_THEME.classic]: 'Classic',
  [WHEEL_THEME.neon]: 'Neon',
  [WHEEL_THEME.pastel]: 'Pastel',
  [WHEEL_THEME.minimal]: 'Minimal',
  [WHEEL_THEME.dark]: 'Dark',
  [WHEEL_THEME.rainbow]: 'Rainbow',
};

export const DEFAULT_WHEEL_APPEARANCE: WheelAppearance = {
  title: '',
  size: WHEEL_SIZE.md,
  theme: WHEEL_THEME.classic,
  segmentColors: ['#4f46e5', '#0f766e', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#9333ea'],
  textColor: '#0f172a',
  pointerColor: '#4f46e5',
  borderWidth: 1,
  borderColor: '#ffffff',
  fontSize: 14,
  fontWeight: 600,
  background: '#f8fafc',
  centerButtonStyle: CENTER_BUTTON_STYLE.filled,
  centerButtonColor: '#111827',
  centerButtonTextColor: '#f8fafc',
};

export const WHEEL_THEME_PRESETS: Record<Exclude<WheelTheme, 'custom'>, WheelAppearance> = {
  [WHEEL_THEME.classic]: DEFAULT_WHEEL_APPEARANCE,
  [WHEEL_THEME.neon]: {
    title: '',
    size: WHEEL_SIZE.md,
    theme: WHEEL_THEME.neon,
    segmentColors: ['#22d3ee', '#e879f9', '#a3e635', '#f43f5e', '#818cf8', '#fbbf24'],
    textColor: '#ecfeff',
    pointerColor: '#22d3ee',
    borderWidth: 2,
    borderColor: '#082f49',
    fontSize: 14,
    fontWeight: 700,
    background: '#020617',
    centerButtonStyle: CENTER_BUTTON_STYLE.filled,
    centerButtonColor: '#22d3ee',
    centerButtonTextColor: '#082f49',
  },
  [WHEEL_THEME.pastel]: {
    title: '',
    size: WHEEL_SIZE.md,
    theme: WHEEL_THEME.pastel,
    segmentColors: ['#fecdd3', '#e9d5ff', '#bae6fd', '#bbf7d0', '#fde68a', '#fed7aa'],
    textColor: '#3f3f46',
    pointerColor: '#c084fc',
    borderWidth: 2,
    borderColor: '#fdf4ff',
    fontSize: 14,
    fontWeight: 600,
    background: '#fff7ed',
    centerButtonStyle: CENTER_BUTTON_STYLE.filled,
    centerButtonColor: '#f5d0fe',
    centerButtonTextColor: '#6b21a8',
  },
  [WHEEL_THEME.minimal]: {
    title: '',
    size: WHEEL_SIZE.md,
    theme: WHEEL_THEME.minimal,
    segmentColors: ['#f8fafc', '#e5e7eb', '#d1d5db', '#9ca3af'],
    textColor: '#111827',
    pointerColor: '#111827',
    borderWidth: 1,
    borderColor: '#111827',
    fontSize: 13,
    fontWeight: 400,
    background: '#ffffff',
    centerButtonStyle: CENTER_BUTTON_STYLE.outlined,
    centerButtonColor: '#111827',
    centerButtonTextColor: '#111827',
  },
  [WHEEL_THEME.dark]: {
    title: '',
    size: WHEEL_SIZE.md,
    theme: WHEEL_THEME.dark,
    segmentColors: ['#1e293b', '#334155', '#0f766e', '#4c1d95', '#7f1d1d', '#365314'],
    textColor: '#f8fafc',
    pointerColor: '#38bdf8',
    borderWidth: 2,
    borderColor: '#0f172a',
    fontSize: 14,
    fontWeight: 600,
    background: '#020617',
    centerButtonStyle: CENTER_BUTTON_STYLE.filled,
    centerButtonColor: '#0f172a',
    centerButtonTextColor: '#38bdf8',
  },
  [WHEEL_THEME.rainbow]: {
    title: '',
    size: WHEEL_SIZE.md,
    theme: WHEEL_THEME.rainbow,
    segmentColors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
    textColor: '#0f172a',
    pointerColor: '#111827',
    borderWidth: 2,
    borderColor: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    background: '#fff7ed',
    centerButtonStyle: CENTER_BUTTON_STYLE.filled,
    centerButtonColor: '#111827',
    centerButtonTextColor: '#f8fafc',
  },
};

export const WHEEL_SIZE_MAX_WIDTH = {
  [WHEEL_SIZE.sm]: { xs: 240, sm: 280, md: 320 },
  [WHEEL_SIZE.md]: { xs: 320, sm: 420, md: 520 },
  [WHEEL_SIZE.lg]: { xs: 320, sm: 520, md: 640 },
} as const;

export const WHEEL_FONT_SIZE_MIN = 10;
export const WHEEL_FONT_SIZE_MAX = 22;
export const WHEEL_BORDER_WIDTH_MIN = 0;
export const WHEEL_BORDER_WIDTH_MAX = 8;

export function isHexColor(value: string): value is HexColor {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

export function normalizeHexColor(value: string, fallback: HexColor): HexColor {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase() as HexColor;
  }

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase() as HexColor;
  }

  return fallback;
}
