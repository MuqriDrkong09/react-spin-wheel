import { SOUND_CHANNEL, SOUND_ID } from '@/types/sound';

import { clampVolume, SoundEngine, type AudioContextLike } from './soundEngine';

function createFakeContext(): AudioContextLike & { oscillators: Array<{ start: ReturnType<typeof vi.fn> }> } {
  const oscillators: Array<{ start: ReturnType<typeof vi.fn> }> = [];
  const context: AudioContextLike & { oscillators: typeof oscillators } = {
    state: 'suspended',
    currentTime: 0,
    destination: {},
    oscillators,
    resume: vi.fn(async () => {
      context.state = 'running';
    }),
    close: vi.fn(async () => {
      context.state = 'closed';
    }),
    createOscillator: () => {
      const oscillator = {
        type: 'sine' as OscillatorType,
        frequency: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      };
      oscillators.push(oscillator);
      return oscillator;
    },
    createGain: () => ({
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
  };

  return context;
}

describe('SoundEngine', () => {
  it('clamps volume into range', () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(2)).toBe(1);
    expect(clampVolume(0.4)).toBe(0.4);
  });

  it('does not create audio before a gesture when sound is disabled', () => {
    const createContext = vi.fn();
    const engine = new SoundEngine({ createContext });
    engine.setEnabled(false);

    expect(engine.play(SOUND_ID.spinStart)).toBe(false);
    expect(createContext).not.toHaveBeenCalled();
    engine.dispose();
  });

  it('does not play when volume is zero', () => {
    const createContext = vi.fn(() => {
      const context = createFakeContext();
      context.state = 'running';
      return context;
    });
    const engine = new SoundEngine({ createContext });
    engine.setVolume(0);

    expect(engine.play(SOUND_ID.winner)).toBe(false);
    expect(createContext).not.toHaveBeenCalled();
    engine.dispose();
  });

  it('skips channel sounds that are turned off', () => {
    const context = createFakeContext();
    context.state = 'running';
    const engine = new SoundEngine({ createContext: () => context });
    engine.setChannels({ [SOUND_CHANNEL.tick]: false });

    expect(engine.play(SOUND_ID.wheelTick)).toBe(false);
    expect(engine.play(SOUND_ID.spinStart)).toBe(true);
    engine.dispose();
  });

  it('resumes a suspended context and plays after unlock', async () => {
    const context = createFakeContext();
    const engine = new SoundEngine({ createContext: () => context });

    expect(await engine.unlock()).toBe(true);
    expect(context.resume).toHaveBeenCalled();
    expect(engine.play(SOUND_ID.spinEnd)).toBe(true);
    expect(context.oscillators.length).toBeGreaterThan(0);
    engine.dispose();
  });

  it('rate-limits wheel ticks', () => {
    let now = 0;
    const context = createFakeContext();
    context.state = 'running';
    const engine = new SoundEngine({
      createContext: () => context,
      now: () => now,
    });

    expect(engine.play(SOUND_ID.wheelTick)).toBe(true);
    now += 10;
    expect(engine.play(SOUND_ID.wheelTick)).toBe(false);
    now += 20;
    expect(engine.play(SOUND_ID.wheelTick)).toBe(true);
    engine.dispose();
  });

  it('unlocks from a user gesture and cleans up listeners', async () => {
    const context = createFakeContext();
    const engine = new SoundEngine({ createContext: () => context });
    const listeners = new Map<string, EventListener>();
    const target = {
      addEventListener: vi.fn((eventName: string, listener: EventListener) => {
        listeners.set(eventName, listener);
      }),
      removeEventListener: vi.fn((eventName: string) => {
        listeners.delete(eventName);
      }),
    };

    engine.attachUnlockListeners(target);
    listeners.get('pointerdown')?.(new Event('pointerdown'));
    await Promise.resolve();
    await Promise.resolve();
    expect(context.resume).toHaveBeenCalled();
    expect(target.removeEventListener).toHaveBeenCalled();

    engine.dispose();
    context.resume.mockClear();
    listeners.get('pointerdown')?.(new Event('pointerdown'));
    expect(context.resume).not.toHaveBeenCalled();
  });

  it('stops unlocking after Web Audio is unavailable', async () => {
    const createContext = vi.fn(() => {
      throw new Error('unsupported');
    });
    const engine = new SoundEngine({ createContext });
    const listeners = new Map<string, EventListener>();
    const target = {
      addEventListener: vi.fn((eventName: string, listener: EventListener) => {
        listeners.set(eventName, listener);
      }),
      removeEventListener: vi.fn((eventName: string) => {
        listeners.delete(eventName);
      }),
    };

    engine.attachUnlockListeners(target);
    listeners.get('keydown')?.(new Event('keydown'));
    await Promise.resolve();
    await Promise.resolve();

    expect(createContext).toHaveBeenCalledTimes(1);
    expect(engine.play(SOUND_ID.spinStart)).toBe(false);
    expect(createContext).toHaveBeenCalledTimes(1);
    engine.dispose();
  });

  it('closes the audio context on dispose', () => {
    const context = createFakeContext();
    context.state = 'running';
    const engine = new SoundEngine({ createContext: () => context });
    engine.play(SOUND_ID.celebration);
    engine.dispose();

    expect(context.close).toHaveBeenCalled();
    expect(engine.play(SOUND_ID.celebration)).toBe(false);
  });
});
