import { DEFAULT_MASTER_VOLUME } from '@/constants/sound';
import { clampVolume, SoundEngine, type AudioContextLike, type GestureTarget } from '@/features/sound/soundEngine';
import { SOUND_CHANNEL, SOUND_ID } from '@/types/sound';

type FakeOscillator = {
  type: OscillatorType;
  frequency: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime?: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  onended: (() => void) | null;
};

type FakeGain = {
  gain: {
    value: number;
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

type FakeContext = AudioContextLike & {
  oscillators: FakeOscillator[];
  gains: FakeGain[];
  resume: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

function createFakeContext(
  options: {
    omitFrequencyRamp?: boolean;
    throwOnDisconnect?: boolean;
    throwOnCreateOscillator?: boolean;
  } = {},
): FakeContext {
  const oscillators: FakeOscillator[] = [];
  const gains: FakeGain[] = [];
  const context: FakeContext = {
    state: 'suspended',
    currentTime: 0,
    destination: {},
    oscillators,
    gains,
    resume: vi.fn(async () => {
      context.state = 'running';
    }),
    close: vi.fn(async () => {
      context.state = 'closed';
    }),
    createOscillator: () => {
      if (options.throwOnCreateOscillator) {
        throw new Error('oscillator failed');
      }

      const oscillator: FakeOscillator = {
        type: 'sine',
        frequency: {
          setValueAtTime: vi.fn(),
          ...(options.omitFrequencyRamp ? {} : { linearRampToValueAtTime: vi.fn() }),
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      };
      oscillators.push(oscillator);
      return oscillator;
    },
    createGain: () => {
      const gain: FakeGain = {
        gain: {
          value: 0,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(() => {
          if (options.throwOnDisconnect) {
            throw new Error('already stopped');
          }
        }),
      };
      gains.push(gain);
      return gain;
    },
  };

  return context;
}

function createGestureTarget() {
  const listeners = new Map<string, EventListener>();
  const target: GestureTarget & {
    listeners: Map<string, EventListener>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  } = {
    listeners,
    addEventListener: vi.fn((eventName: string, listener: EventListener) => {
      listeners.set(eventName, listener);
    }),
    removeEventListener: vi.fn((eventName: string) => {
      listeners.delete(eventName);
    }),
  };

  return target;
}

function installFakeAudioContext(createContext: () => FakeContext) {
  const audioWindow = window as Window & {
    AudioContext?: unknown;
    webkitAudioContext?: unknown;
  };
  const originalAudioContext = audioWindow.AudioContext;
  const originalWebkit = audioWindow.webkitAudioContext;

  class FakeBrowserAudioContext {
    constructor() {
      Object.assign(this, createContext());
    }
  }

  return {
    FakeBrowserAudioContext,
    restore() {
      audioWindow.AudioContext = originalAudioContext;
      audioWindow.webkitAudioContext = originalWebkit;
    },
  };
}

describe('SoundEngine', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('clamps volume into range', () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(2)).toBe(1);
    expect(clampVolume(0.4)).toBe(0.4);
    expect(clampVolume(Number.NaN)).toBe(DEFAULT_MASTER_VOLUME);
    expect(clampVolume(Number.POSITIVE_INFINITY)).toBe(DEFAULT_MASTER_VOLUME);
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
    expect(engine.isUnlocked()).toBe(true);
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
    const target = createGestureTarget();

    engine.attachUnlockListeners(target);
    target.listeners.get('pointerdown')?.(new Event('pointerdown'));
    await Promise.resolve();
    await Promise.resolve();
    expect(context.resume).toHaveBeenCalled();
    expect(target.removeEventListener).toHaveBeenCalled();

    engine.dispose();
    context.resume.mockClear();
    target.listeners.get('pointerdown')?.(new Event('pointerdown'));
    expect(context.resume).not.toHaveBeenCalled();
  });

  it('stops unlocking after Web Audio is unavailable', async () => {
    const createContext = vi.fn(() => {
      throw new Error('unsupported');
    });
    const engine = new SoundEngine({ createContext });
    const target = createGestureTarget();

    engine.attachUnlockListeners(target);
    target.listeners.get('keydown')?.(new Event('keydown'));
    await Promise.resolve();
    await Promise.resolve();

    expect(createContext).toHaveBeenCalledTimes(1);
    expect(engine.play(SOUND_ID.spinStart)).toBe(false);
    expect(await engine.unlock()).toBe(false);
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
    expect(engine.isUnlocked()).toBe(false);
  });

  it('plays every synthesized sound while the context is running', () => {
    const context = createFakeContext();
    context.state = 'running';
    const engine = new SoundEngine({ createContext: () => context });

    expect(engine.play(SOUND_ID.spinStart)).toBe(true);
    expect(engine.play(SOUND_ID.spinEnd)).toBe(true);
    expect(engine.play(SOUND_ID.winner)).toBe(true);
    expect(engine.play(SOUND_ID.celebration)).toBe(true);
    expect(context.oscillators.length).toBeGreaterThan(4);

    for (const oscillator of context.oscillators) {
      oscillator.onended?.();
    }

    engine.dispose();
  });

  it('sweeps spin start when frequency ramps are unavailable', () => {
    const context = createFakeContext({ omitFrequencyRamp: true });
    context.state = 'running';
    const engine = new SoundEngine({ createContext: () => context });

    expect(engine.play(SOUND_ID.spinStart)).toBe(true);
    expect(context.oscillators[0]?.frequency.linearRampToValueAtTime).toBeUndefined();
    context.oscillators[0]?.onended?.();
    engine.dispose();
  });

  it('uses a tiny envelope peak when volume is nearly silent', () => {
    const context = createFakeContext();
    context.state = 'running';
    const engine = new SoundEngine({ createContext: () => context });
    engine.setVolume(0.000001);

    expect(engine.play(SOUND_ID.wheelTick)).toBe(true);
    expect(context.gains[0]?.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.0001, expect.any(Number));
    engine.dispose();
  });

  it('plays after a suspended context resumes', async () => {
    const context = createFakeContext();
    const engine = new SoundEngine({ createContext: () => context });

    expect(engine.play(SOUND_ID.winner)).toBe(true);
    expect(context.oscillators).toHaveLength(0);

    await Promise.resolve();
    expect(context.oscillators.length).toBeGreaterThan(0);
    engine.dispose();
  });

  it('does not trigger after a suspended play if the engine is stopped first', async () => {
    const context = createFakeContext();
    const engine = new SoundEngine({ createContext: () => context });

    expect(engine.play(SOUND_ID.spinStart)).toBe(true);
    engine.setEnabled(false);
    await Promise.resolve();

    expect(context.oscillators).toHaveLength(0);
    engine.dispose();
  });

  it('does not trigger after a suspended play if the engine is disposed first', async () => {
    const context = createFakeContext();
    const engine = new SoundEngine({ createContext: () => context });

    expect(engine.play(SOUND_ID.spinEnd)).toBe(true);
    engine.dispose();
    await Promise.resolve();

    expect(context.oscillators).toHaveLength(0);
  });

  it('skips triggering when the context stops running', () => {
    const context = createFakeContext();
    let stateReads = 0;
    Object.defineProperty(context, 'state', {
      configurable: true,
      get() {
        stateReads += 1;
        return stateReads <= 2 ? 'running' : 'interrupted';
      },
    });
    const engine = new SoundEngine({ createContext: () => context });

    expect(engine.play(SOUND_ID.spinStart)).toBe(true);
    expect(context.oscillators).toHaveLength(0);
    engine.dispose();
  });

  it('does not play when the context is not running or suspended', () => {
    const context = createFakeContext();
    context.state = 'closed';
    const engine = new SoundEngine({ createContext: () => context });

    expect(engine.play(SOUND_ID.spinStart)).toBe(false);
    engine.dispose();
  });

  it('returns false when resume throws during play', () => {
    const context = createFakeContext();
    context.resume = vi.fn(() => {
      throw new Error('blocked');
    });
    const engine = new SoundEngine({ createContext: () => context });

    expect(engine.play(SOUND_ID.spinStart)).toBe(false);
    engine.dispose();
  });

  it('keeps audio optional when synthesizing a sound throws', () => {
    const context = createFakeContext({ throwOnCreateOscillator: true });
    context.state = 'running';
    const engine = new SoundEngine({ createContext: () => context });

    expect(engine.play(SOUND_ID.winner)).toBe(true);
    engine.dispose();
  });

  it('unlocks an already running context without resuming', async () => {
    const context = createFakeContext();
    context.state = 'running';
    const engine = new SoundEngine({ createContext: () => context });

    expect(await engine.unlock()).toBe(true);
    expect(context.resume).not.toHaveBeenCalled();
    expect(engine.isUnlocked()).toBe(true);
    engine.dispose();
  });

  it('returns false from unlock when disabled, disposed, or resume fails', async () => {
    const context = createFakeContext();
    const engine = new SoundEngine({ createContext: () => context });
    engine.setEnabled(false);
    expect(await engine.unlock()).toBe(false);

    engine.setEnabled(true);
    context.resume = vi.fn(async () => {
      throw new Error('blocked');
    });
    expect(await engine.unlock()).toBe(false);

    engine.dispose();
    expect(await engine.unlock()).toBe(false);
  });

  it('leaves listeners attached when unlock does not start audio', async () => {
    const context = createFakeContext();
    context.resume = vi.fn(async () => undefined);
    const engine = new SoundEngine({ createContext: () => context });
    const target = createGestureTarget();
    const detach = engine.attachUnlockListeners(target);

    target.listeners.get('touchstart')?.(new Event('touchstart'));
    await Promise.resolve();
    await Promise.resolve();

    expect(engine.isUnlocked()).toBe(false);
    expect(target.removeEventListener).not.toHaveBeenCalled();
    detach();
    expect(target.removeEventListener).toHaveBeenCalled();
    engine.dispose();
  });

  it('does not attach listeners after dispose', () => {
    const context = createFakeContext();
    const engine = new SoundEngine({ createContext: () => context });
    const target = createGestureTarget();
    engine.dispose();

    const detach = engine.attachUnlockListeners(target);
    detach();

    expect(target.addEventListener).not.toHaveBeenCalled();
  });

  it('attaches unlock listeners to window by default', () => {
    const context = createFakeContext();
    context.state = 'running';
    const engine = new SoundEngine({ createContext: () => context });
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');

    const detach = engine.attachUnlockListeners();
    detach();
    engine.dispose();

    expect(add).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    add.mockRestore();
    remove.mockRestore();
  });

  it('stops active sounds and ignores disconnect errors', () => {
    const context = createFakeContext({ throwOnDisconnect: true });
    context.state = 'running';
    const engine = new SoundEngine({ createContext: () => context });
    engine.play(SOUND_ID.spinEnd);
    context.oscillators.forEach((oscillator) => oscillator.onended?.());
    context.currentTime = undefined as unknown as number;

    expect(() => engine.setEnabled(false)).not.toThrow();
    engine.setEnabled(true);
    engine.dispose();
  });

  it('disconnects tracked gains after the timeout', () => {
    vi.useFakeTimers();
    const context = createFakeContext();
    context.state = 'running';
    const engine = new SoundEngine({ createContext: () => context });
    engine.play(SOUND_ID.wheelTick);

    vi.advanceTimersByTime(2000);
    expect(context.gains[0]?.disconnect).toHaveBeenCalled();
    engine.dispose();
  });

  it('ignores disconnect errors when the gain timeout fires', () => {
    vi.useFakeTimers();
    const context = createFakeContext({ throwOnDisconnect: true });
    context.state = 'running';
    const engine = new SoundEngine({ createContext: () => context });
    engine.play(SOUND_ID.spinStart);

    expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
    engine.dispose();
  });

  it('ignores close errors on dispose', async () => {
    const context = createFakeContext();
    context.state = 'running';
    context.close = vi.fn(async () => {
      throw new Error('already closed');
    });
    const engine = new SoundEngine({ createContext: () => context });
    engine.play(SOUND_ID.celebration);
    engine.dispose();
    await Promise.resolve();

    expect(context.close).toHaveBeenCalled();
  });

  it('disposes safely when no context was created', () => {
    const engine = new SoundEngine({ createContext: vi.fn() });
    expect(() => engine.dispose()).not.toThrow();
  });

  it('uses the browser AudioContext when no factory is provided', () => {
    const fake = installFakeAudioContext(() => {
      const context = createFakeContext();
      context.state = 'running';
      return context;
    });
    const audioWindow = window as Window & { AudioContext?: unknown };
    audioWindow.AudioContext = fake.FakeBrowserAudioContext;

    const engine = new SoundEngine();
    expect(engine.play(SOUND_ID.spinStart)).toBe(true);
    engine.dispose();
    fake.restore();
  });

  it('falls back to webkitAudioContext when AudioContext is missing', () => {
    const fake = installFakeAudioContext(() => {
      const context = createFakeContext();
      context.state = 'running';
      return context;
    });
    const audioWindow = window as Window & {
      AudioContext?: unknown;
      webkitAudioContext?: unknown;
    };
    audioWindow.AudioContext = undefined;
    audioWindow.webkitAudioContext = fake.FakeBrowserAudioContext;

    const engine = new SoundEngine({ now: () => 0 });
    expect(engine.play(SOUND_ID.winner)).toBe(true);
    engine.dispose();
    fake.restore();
  });

  it('treats a missing Web Audio implementation as unavailable', () => {
    const fake = installFakeAudioContext(() => createFakeContext());
    const audioWindow = window as Window & {
      AudioContext?: unknown;
      webkitAudioContext?: unknown;
    };
    audioWindow.AudioContext = undefined;
    audioWindow.webkitAudioContext = undefined;

    const engine = new SoundEngine();
    expect(engine.play(SOUND_ID.spinStart)).toBe(false);
    engine.dispose();
    fake.restore();
  });
});
