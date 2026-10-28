export const SOUND_ID = {
  spinStart: 'spinStart',
  wheelTick: 'wheelTick',
  spinEnd: 'spinEnd',
  winner: 'winner',
  celebration: 'celebration',
} as const;

export type SoundId = (typeof SOUND_ID)[keyof typeof SOUND_ID];

export const SOUND_CHANNEL = {
  spin: 'spin',
  tick: 'tick',
  winner: 'winner',
} as const;

export type SoundChannel = (typeof SOUND_CHANNEL)[keyof typeof SOUND_CHANNEL];

export const SOUND_CHANNEL_BY_ID: Record<SoundId, SoundChannel> = {
  [SOUND_ID.spinStart]: SOUND_CHANNEL.spin,
  [SOUND_ID.spinEnd]: SOUND_CHANNEL.spin,
  [SOUND_ID.wheelTick]: SOUND_CHANNEL.tick,
  [SOUND_ID.winner]: SOUND_CHANNEL.winner,
  [SOUND_ID.celebration]: SOUND_CHANNEL.winner,
};

export function isSoundId(value: string): value is SoundId {
  return Object.values(SOUND_ID).some((id) => id === value);
}
