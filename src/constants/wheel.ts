import { SELECTION_MODE, type HexColor, type WheelSettings } from '@/types/wheel';

export const WHEEL_CATEGORIES = ['General', 'Food', 'Games', 'Decisions', 'Custom'] as const;

export type WheelCategory = (typeof WHEEL_CATEGORIES)[number];

export const DEFAULT_WHEEL_CATEGORY: WheelCategory = 'General';

export const ITEM_COLORS = [
  '#4f46e5',
  '#0f766e',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#2563eb',
  '#9333ea',
] as const satisfies readonly HexColor[];

export const DEFAULT_WHEEL_SETTINGS: WheelSettings = {
  durationMs: 4000,
  minRotations: 4,
  maxRotations: 8,
  soundEnabled: true,
  confettiEnabled: true,
  eliminationMode: false,
  selectionMode: SELECTION_MODE.manual,
  removeWinner: false,
  skipDisabledItems: true,
};
