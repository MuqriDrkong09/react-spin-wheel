import { SOUND_ID, type SoundId } from '@/types/sound';

export const SOUND_VOLUME_MIN = 0;
export const SOUND_VOLUME_MAX = 1;
export const DEFAULT_MASTER_VOLUME = 0.7;
export const MIN_TICK_INTERVAL_MS = 20;

export const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

export const SOUND_MESSAGES = {
  title: 'Sound',
  description: 'Control spin, tick, and winner audio. Sound is optional and stays off until you interact with the app.',
  enabled: 'Enable sound',
  masterVolume: 'Master volume',
  spinSound: 'Spin sounds',
  tickSound: 'Tick sounds',
  winnerSound: 'Winner sounds',
  preview: 'Preview sounds',
} as const;

export const SOUND_PREVIEW_ORDER: SoundId[] = [
  SOUND_ID.spinStart,
  SOUND_ID.wheelTick,
  SOUND_ID.spinEnd,
  SOUND_ID.winner,
  SOUND_ID.celebration,
];
