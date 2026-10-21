import type { WheelSettings } from '@/types/wheel';

export const DEFAULT_WHEEL_SETTINGS: WheelSettings = {
  durationMs: 4000,
  minRotations: 4,
  maxRotations: 8,
  soundEnabled: true,
  confettiEnabled: true,
  eliminationMode: false,
  autoSpinChildren: true,
  skipDisabledItems: true,
};
