import { SOUND_CHANNEL, SOUND_CHANNEL_BY_ID, SOUND_ID, isSoundId } from '@/types/sound';

describe('sound', () => {
  it('exposes spin, tick, and winner sound ids', () => {
    expect(SOUND_ID).toEqual({
      spinStart: 'spinStart',
      wheelTick: 'wheelTick',
      spinEnd: 'spinEnd',
      winner: 'winner',
      celebration: 'celebration',
    });
  });

  it('exposes spin, tick, and winner channels', () => {
    expect(SOUND_CHANNEL).toEqual({
      spin: 'spin',
      tick: 'tick',
      winner: 'winner',
    });
  });

  it('maps each sound id to its channel', () => {
    expect(SOUND_CHANNEL_BY_ID).toEqual({
      [SOUND_ID.spinStart]: SOUND_CHANNEL.spin,
      [SOUND_ID.spinEnd]: SOUND_CHANNEL.spin,
      [SOUND_ID.wheelTick]: SOUND_CHANNEL.tick,
      [SOUND_ID.winner]: SOUND_CHANNEL.winner,
      [SOUND_ID.celebration]: SOUND_CHANNEL.winner,
    });
  });

  it('accepts known sound ids', () => {
    expect(isSoundId(SOUND_ID.spinStart)).toBe(true);
    expect(isSoundId(SOUND_ID.wheelTick)).toBe(true);
    expect(isSoundId(SOUND_ID.spinEnd)).toBe(true);
    expect(isSoundId(SOUND_ID.winner)).toBe(true);
    expect(isSoundId(SOUND_ID.celebration)).toBe(true);
    expect(isSoundId('spinStart')).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(isSoundId('')).toBe(false);
    expect(isSoundId('spin')).toBe(false);
    expect(isSoundId('tick')).toBe(false);
    expect(isSoundId('unknown')).toBe(false);
  });
});
