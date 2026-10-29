import { act, render, renderHook } from '@testing-library/react';
import type { EffectCallback, DependencyList, ReactNode } from 'react';

import { DEFAULT_MASTER_VOLUME, SOUND_PREVIEW_ORDER } from '@/constants/sound';
import { SoundProvider } from '@/features/sound/SoundProvider';
import type { SoundEngine } from '@/features/sound/soundEngine';
import { useSound } from '@/features/sound/useSound';
import { resetSettingsStore, useSettingsStore } from '@/stores/settingsStore';
import { SOUND_CHANNEL, SOUND_ID } from '@/types/sound';

const soundEngineMocks = vi.hoisted(() => ({
  applySettingsEarly: false,
  instances: [] as Array<{
    setEnabled: ReturnType<typeof vi.fn>;
    setVolume: ReturnType<typeof vi.fn>;
    setChannels: ReturnType<typeof vi.fn>;
    play: ReturnType<typeof vi.fn>;
    unlock: ReturnType<typeof vi.fn>;
    attachUnlockListeners: ReturnType<typeof vi.fn>;
    detachUnlockListeners: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();

  return {
    ...actual,
    useEffect(effect: EffectCallback, deps?: DependencyList) {
      if (
        soundEngineMocks.applySettingsEarly &&
        deps?.length === 1 &&
        typeof deps[0] === 'function'
      ) {
        effect();
      }

      return actual.useEffect(effect, deps);
    },
  };
});

vi.mock('@/features/sound/soundEngine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/sound/soundEngine')>();

  class SoundEngine {
    setEnabled = vi.fn();
    setVolume = vi.fn();
    setChannels = vi.fn();
    play = vi.fn(() => true);
    unlock = vi.fn(async () => true);
    attachUnlockListeners = vi.fn();
    detachUnlockListeners = vi.fn();
    dispose = vi.fn();

    constructor() {
      soundEngineMocks.instances.push(this);
    }
  }

  return { ...actual, SoundEngine };
});

function createMockEngine() {
  return {
    setEnabled: vi.fn(),
    setVolume: vi.fn(),
    setChannels: vi.fn(),
    play: vi.fn(() => true),
    unlock: vi.fn(async () => true),
    attachUnlockListeners: vi.fn(),
    detachUnlockListeners: vi.fn(),
    dispose: vi.fn(),
  };
}

function wrapper(engine?: SoundEngine) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SoundProvider engine={engine}>{children}</SoundProvider>;
  };
}

describe('SoundProvider', () => {
  beforeEach(() => {
    soundEngineMocks.applySettingsEarly = false;
    soundEngineMocks.instances.length = 0;
    resetSettingsStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates an engine, applies settings, and disposes it on unmount', () => {
    const { unmount } = renderHook(() => useSound(), { wrapper: wrapper() });
    const engine = soundEngineMocks.instances[0];

    expect(soundEngineMocks.instances).toHaveLength(1);
    expect(engine?.attachUnlockListeners).toHaveBeenCalledTimes(1);
    expect(engine?.setEnabled).toHaveBeenCalledWith(true);
    expect(engine?.setVolume).toHaveBeenCalledWith(DEFAULT_MASTER_VOLUME);
    expect(engine?.setChannels).toHaveBeenCalledWith({
      [SOUND_CHANNEL.spin]: true,
      [SOUND_CHANNEL.tick]: true,
      [SOUND_CHANNEL.winner]: true,
    });

    unmount();

    expect(engine?.detachUnlockListeners).toHaveBeenCalledTimes(1);
    expect(engine?.dispose).toHaveBeenCalledTimes(1);
  });

  it('uses an injected engine without attaching listeners or disposing it', () => {
    const engine = createMockEngine();
    const { unmount } = renderHook(() => useSound(), {
      wrapper: wrapper(engine as unknown as SoundEngine),
    });

    expect(soundEngineMocks.instances).toHaveLength(0);
    expect(engine.attachUnlockListeners).not.toHaveBeenCalled();
    expect(engine.setEnabled).toHaveBeenCalledWith(true);
    expect(engine.setVolume).toHaveBeenCalledWith(DEFAULT_MASTER_VOLUME);

    unmount();

    expect(engine.detachUnlockListeners).toHaveBeenCalledTimes(1);
    expect(engine.dispose).not.toHaveBeenCalled();
  });

  it('creates an engine from play when the provider has not mounted its own yet', () => {
    function PlayOnRender() {
      const sound = useSound();
      sound.play(SOUND_ID.winner);
      return null;
    }

    render(
      <SoundProvider>
        <PlayOnRender />
      </SoundProvider>,
    );

    expect(soundEngineMocks.instances).toHaveLength(1);
    expect(soundEngineMocks.instances[0]?.attachUnlockListeners).toHaveBeenCalledTimes(1);
    expect(soundEngineMocks.instances[0]?.play).toHaveBeenCalledWith(SOUND_ID.winner);
  });

  it('plays and unlocks through the injected engine', async () => {
    const engine = createMockEngine();
    const { result } = renderHook(() => useSound(), {
      wrapper: wrapper(engine as unknown as SoundEngine),
    });

    expect(result.current.play(SOUND_ID.spinStart)).toBe(true);
    await expect(result.current.unlock()).resolves.toBe(true);
    expect(engine.play).toHaveBeenCalledWith(SOUND_ID.spinStart);
    expect(engine.unlock).toHaveBeenCalledTimes(1);
  });

  it('returns false when play or unlock throws', async () => {
    const engine = createMockEngine();
    engine.play.mockImplementation(() => {
      throw new Error('blocked');
    });
    engine.unlock.mockRejectedValue(new Error('blocked'));

    const { result } = renderHook(() => useSound(), {
      wrapper: wrapper(engine as unknown as SoundEngine),
    });

    expect(result.current.play(SOUND_ID.spinEnd)).toBe(false);
    await expect(result.current.unlock()).resolves.toBe(false);
  });

  it('reapplies settings when the store changes', () => {
    const engine = createMockEngine();
    renderHook(() => useSound(), { wrapper: wrapper(engine as unknown as SoundEngine) });

    act(() => {
      useSettingsStore.getState().updateSettings({
        soundEnabled: false,
        masterVolume: 0.2,
        spinSound: false,
        tickSound: false,
        winnerSound: false,
      });
    });

    expect(engine.setEnabled).toHaveBeenLastCalledWith(false);
    expect(engine.setVolume).toHaveBeenLastCalledWith(0.2);
    expect(engine.setChannels).toHaveBeenLastCalledWith({
      [SOUND_CHANNEL.spin]: false,
      [SOUND_CHANNEL.tick]: false,
      [SOUND_CHANNEL.winner]: false,
    });
  });

  it('previews sounds in order and replaces a queued preview', () => {
    vi.useFakeTimers();
    const engine = createMockEngine();
    const { result } = renderHook(() => useSound(), {
      wrapper: wrapper(engine as unknown as SoundEngine),
    });

    act(() => {
      result.current.preview();
      result.current.preview();
    });

    act(() => {
      vi.advanceTimersByTime((SOUND_PREVIEW_ORDER.length - 1) * 280);
    });

    expect(engine.play.mock.calls.map((call) => call[0])).toEqual(SOUND_PREVIEW_ORDER);
  });

  it('clears preview timers on unmount', () => {
    vi.useFakeTimers();
    const engine = createMockEngine();
    const { result, unmount } = renderHook(() => useSound(), {
      wrapper: wrapper(engine as unknown as SoundEngine),
    });

    act(() => {
      result.current.preview();
    });
    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(engine.play).not.toHaveBeenCalled();
  });

  it('skips applying settings when the engine is not ready', () => {
    soundEngineMocks.applySettingsEarly = true;

    render(
      <SoundProvider>
        <span>ok</span>
      </SoundProvider>,
    );

    expect(soundEngineMocks.instances.length).toBeGreaterThan(0);
  });

  it('adopts an injected engine after disposing the default engine', () => {
    const injected = createMockEngine();

    function Harness({ engine }: { engine?: SoundEngine }) {
      return (
        <SoundProvider engine={engine}>
          <span>ok</span>
        </SoundProvider>
      );
    }

    const { rerender } = render(<Harness />);
    const created = soundEngineMocks.instances[0];

    rerender(<Harness engine={injected as unknown as SoundEngine} />);

    expect(created?.dispose).toHaveBeenCalledTimes(1);
    expect(injected.attachUnlockListeners).not.toHaveBeenCalled();
  });
});
