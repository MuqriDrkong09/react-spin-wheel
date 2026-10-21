export const COLOR_MODE = {
  light: 'light',
  dark: 'dark',
} as const;

export type ColorMode = (typeof COLOR_MODE)[keyof typeof COLOR_MODE];
