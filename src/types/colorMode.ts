export const COLOR_MODE = {
  light: 'light',
  dark: 'dark',
  system: 'system',
} as const;

export type ColorMode = (typeof COLOR_MODE)[keyof typeof COLOR_MODE];

export const COLOR_MODE_CYCLE = [COLOR_MODE.light, COLOR_MODE.dark, COLOR_MODE.system] as const;

export function isColorMode(value: unknown): value is ColorMode {
  return value === COLOR_MODE.light || value === COLOR_MODE.dark || value === COLOR_MODE.system;
}
