import { DEFAULT_MASTER_VOLUME } from '@/constants/sound';
import type { AppSettings } from '@/types/settings';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  soundEnabled: true,
  masterVolume: DEFAULT_MASTER_VOLUME,
  spinSound: true,
  tickSound: true,
  winnerSound: true,
  confettiEnabled: true,
  confirmBeforeDelete: true,
};
