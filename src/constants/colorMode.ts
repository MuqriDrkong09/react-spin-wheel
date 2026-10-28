import { COLOR_MODE, type ColorMode } from '@/types/colorMode';

export const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const COLOR_MODE_MESSAGES = {
  choose: 'Choose color mode',
  [COLOR_MODE.light]: 'Light',
  [COLOR_MODE.dark]: 'Dark',
  [COLOR_MODE.system]: 'System',
} as const;

export const COLOR_MODE_OPTIONS: ColorMode[] = [COLOR_MODE.light, COLOR_MODE.dark, COLOR_MODE.system];
