import {
  DEFAULT_MASTER_VOLUME,
  MIN_TICK_INTERVAL_MS,
  SOUND_VOLUME_MAX,
  SOUND_VOLUME_MIN,
  UNLOCK_EVENTS,
} from '@/constants/sound';
import {
  SOUND_CHANNEL,
  SOUND_CHANNEL_BY_ID,
  SOUND_ID,
  type SoundChannel,
  type SoundId,
} from '@/types/sound';

type ChannelFlags = Record<SoundChannel, boolean>;

interface OscillatorLike {
  type: OscillatorType;
  frequency: {
    setValueAtTime: (value: number, time: number) => void;
    linearRampToValueAtTime?: (value: number, time: number) => void;
  };
  connect: (node: unknown) => void;
  start: (time?: number) => void;
  stop: (time?: number) => void;
  onended: (() => void) | null;
}

interface GainLike {
  gain: {
    value: number;
    setValueAtTime: (value: number, time: number) => void;
    linearRampToValueAtTime: (value: number, time: number) => void;
    exponentialRampToValueAtTime: (value: number, time: number) => void;
  };
  connect: (node: unknown) => void;
  disconnect: () => void;
}

export interface AudioContextLike {
  state: string;
  currentTime: number;
  destination: unknown;
  resume: () => Promise<void>;
  close: () => Promise<void>;
  createOscillator: () => OscillatorLike;
  createGain: () => GainLike;
}

export interface GestureTarget {
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

export interface SoundEngineOptions {
  createContext?: () => AudioContextLike;
  now?: () => number;
}

const DEFAULT_CHANNELS: ChannelFlags = {
  [SOUND_CHANNEL.spin]: true,
  [SOUND_CHANNEL.tick]: true,
  [SOUND_CHANNEL.winner]: true,
};

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MASTER_VOLUME;
  }

  return Math.min(SOUND_VOLUME_MAX, Math.max(SOUND_VOLUME_MIN, value));
}

export class SoundEngine {
  private context: AudioContextLike | null = null;
  private enabled = true;
  private volume = DEFAULT_MASTER_VOLUME;
  private channels: ChannelFlags = { ...DEFAULT_CHANNELS };
  private unlocked = false;
  private unavailable = false;
  private disposed = false;
  private lastTickAt = Number.NEGATIVE_INFINITY;
  private readonly activeGains = new Set<GainLike>();
  private readonly timeouts = new Set<number>();
  private readonly listeners: Array<() => void> = [];
  private readonly createContext: () => AudioContextLike;
  private readonly now: () => number;

  constructor(options: SoundEngineOptions = {}) {
    this.createContext = options.createContext ?? createBrowserAudioContext;
    this.now = options.now ?? (() => performance.now());
  }

  attachUnlockListeners(target: GestureTarget = window): () => void {
    if (this.disposed) {
      return () => undefined;
    }

    const onGesture = () => {
      void this.unlock().then((ok) => {
        if (ok || this.unavailable) {
          this.detachUnlockListeners();
        }
      });
    };

    for (const eventName of UNLOCK_EVENTS) {
      target.addEventListener(eventName, onGesture);
      this.listeners.push(() => target.removeEventListener(eventName, onGesture));
    }

    return () => this.detachUnlockListeners();
  }

  detachUnlockListeners(): void {
    for (const remove of this.listeners) {
      remove();
    }
    this.listeners.length = 0;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  setVolume(volume: number): void {
    this.volume = clampVolume(volume);
  }

  setChannels(channels: Partial<ChannelFlags>): void {
    this.channels = { ...this.channels, ...channels };
  }

  isUnlocked(): boolean {
    return this.unlocked && this.context?.state === 'running';
  }

  async unlock(): Promise<boolean> {
    if (this.disposed || !this.enabled || this.unavailable) {
      return false;
    }

    try {
      const context = this.ensureContext();
      if (!context) {
        return false;
      }

      if (context.state === 'suspended') {
        await context.resume();
      }

      this.unlocked = context.state === 'running';
      return this.unlocked;
    } catch {
      this.unlocked = false;
      return false;
    }
  }

  play(id: SoundId): boolean {
    if (!this.canPlay(id)) {
      return false;
    }

    if (id === SOUND_ID.wheelTick) {
      const now = this.now();
      if (now - this.lastTickAt < MIN_TICK_INTERVAL_MS) {
        return false;
      }
      this.lastTickAt = now;
    }

    try {
      const context = this.ensureContext();
      if (!context) {
        return false;
      }

      if (context.state === 'suspended') {
        void context.resume().then(() => {
          if (!this.disposed && this.canPlay(id) && this.context?.state === 'running') {
            this.trigger(id);
          }
        });
        return true;
      }

      if (context.state !== 'running') {
        return false;
      }

      this.unlocked = true;
      this.trigger(id);
      return true;
    } catch {
      return false;
    }
  }

  stopAll(): void {
    for (const timeout of this.timeouts) {
      window.clearTimeout(timeout);
    }
    this.timeouts.clear();

    for (const gain of this.activeGains) {
      try {
        gain.gain.setValueAtTime(0, this.context?.currentTime ?? 0);
        gain.disconnect();
      } catch {
        // Already stopped.
      }
    }
    this.activeGains.clear();
  }

  dispose(): void {
    this.disposed = true;
    this.detachUnlockListeners();
    this.stopAll();

    const context = this.context;
    this.context = null;
    this.unlocked = false;

    if (context) {
      void context.close().catch(() => undefined);
    }
  }

  private canPlay(id: SoundId): boolean {
    if (this.disposed || !this.enabled || this.volume <= 0) {
      return false;
    }

    return this.channels[SOUND_CHANNEL_BY_ID[id]] === true;
  }

  private ensureContext(): AudioContextLike | null {
    if (this.disposed || this.unavailable) {
      return null;
    }

    if (this.context) {
      return this.context;
    }

    try {
      this.context = this.createContext();
      return this.context;
    } catch {
      this.unavailable = true;
      return null;
    }
  }

  private trigger(id: SoundId): void {
    const context = this.context;
    if (!context || context.state !== 'running') {
      return;
    }

    try {
      playSynthesizedSound(context, id, this.volume, (gain) => this.trackGain(gain));
    } catch {
      // Audio is optional.
    }
  }

  private trackGain(gain: GainLike): void {
    this.activeGains.add(gain);
    const timeout = window.setTimeout(() => {
      this.timeouts.delete(timeout);
      this.activeGains.delete(gain);
      try {
        gain.disconnect();
      } catch {
        // Already disconnected with the context.
      }
    }, 2000);
    this.timeouts.add(timeout);
  }
}

function createBrowserAudioContext(): AudioContextLike {
  const Context =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!Context) {
    throw new Error('Web Audio is not available.');
  }

  return new Context() as unknown as AudioContextLike;
}

function playSynthesizedSound(
  context: AudioContextLike,
  id: SoundId,
  masterVolume: number,
  track: (gain: GainLike) => void,
): void {
  const time = context.currentTime;

  if (id === SOUND_ID.wheelTick) {
    tone(context, track, {
      type: 'triangle',
      frequency: 1180,
      start: time,
      duration: 0.03,
      peak: 0.18 * masterVolume,
    });
    return;
  }

  if (id === SOUND_ID.spinStart) {
    sweep(context, track, {
      type: 'sawtooth',
      from: 220,
      to: 90,
      start: time,
      duration: 0.28,
      peak: 0.16 * masterVolume,
    });
    return;
  }

  if (id === SOUND_ID.spinEnd) {
    tone(context, track, {
      type: 'sine',
      frequency: 392,
      start: time,
      duration: 0.16,
      peak: 0.2 * masterVolume,
    });
    tone(context, track, {
      type: 'sine',
      frequency: 523,
      start: time + 0.08,
      duration: 0.18,
      peak: 0.16 * masterVolume,
    });
    return;
  }

  if (id === SOUND_ID.winner) {
    [523, 659, 784].forEach((frequency, index) => {
      tone(context, track, {
        type: 'triangle',
        frequency,
        start: time + index * 0.12,
        duration: 0.22,
        peak: 0.22 * masterVolume,
      });
    });
    return;
  }

  [523, 659, 784, 1046].forEach((frequency, index) => {
    tone(context, track, {
      type: 'sine',
      frequency,
      start: time + index * 0.1,
      duration: 0.28,
      peak: 0.2 * masterVolume,
    });
  });
}

function tone(
  context: AudioContextLike,
  track: (gain: GainLike) => void,
  options: {
    type: OscillatorType;
    frequency: number;
    start: number;
    duration: number;
    peak: number;
  },
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.frequency, options.start);
  envelope(gain, options.start, options.duration, options.peak);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(options.start);
  oscillator.stop(options.start + options.duration);
  oscillator.onended = () => {
    try {
      gain.disconnect();
    } catch {
      // Already cleaned up.
    }
  };
  track(gain);
}

function sweep(
  context: AudioContextLike,
  track: (gain: GainLike) => void,
  options: {
    type: OscillatorType;
    from: number;
    to: number;
    start: number;
    duration: number;
    peak: number;
  },
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.from, options.start);
  oscillator.frequency.linearRampToValueAtTime?.(options.to, options.start + options.duration);
  envelope(gain, options.start, options.duration, options.peak);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(options.start);
  oscillator.stop(options.start + options.duration);
  oscillator.onended = () => {
    try {
      gain.disconnect();
    } catch {
      // Already cleaned up.
    }
  };
  track(gain);
}

function envelope(gain: GainLike, start: number, duration: number, peak: number): void {
  const safePeak = Math.max(0.0001, peak);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(safePeak, start + Math.min(0.02, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
}
