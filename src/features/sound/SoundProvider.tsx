import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';

import { SOUND_PREVIEW_ORDER } from '@/constants/sound';
import { SoundContext } from '@/features/sound/soundContext';
import { SoundEngine } from '@/features/sound/soundEngine';
import { useSettingsStore } from '@/stores/settingsStore';
import { SOUND_CHANNEL, type SoundId } from '@/types/sound';

interface SoundProviderProps {
  children: ReactNode;
  engine?: SoundEngine;
}

export function SoundProvider({ children, engine: engineOverride }: SoundProviderProps) {
  const engineRef = useRef<SoundEngine | null>(engineOverride ?? null);
  const soundEnabled = useSettingsStore((state) => state.settings.soundEnabled);
  const masterVolume = useSettingsStore((state) => state.settings.masterVolume);
  const spinSound = useSettingsStore((state) => state.settings.spinSound);
  const tickSound = useSettingsStore((state) => state.settings.tickSound);
  const winnerSound = useSettingsStore((state) => state.settings.winnerSound);

  const applySettings = useCallback(
    (engine: SoundEngine) => {
      engine.setEnabled(soundEnabled);
      engine.setVolume(masterVolume);
      engine.setChannels({
        [SOUND_CHANNEL.spin]: spinSound,
        [SOUND_CHANNEL.tick]: tickSound,
        [SOUND_CHANNEL.winner]: winnerSound,
      });
    },
    [masterVolume, soundEnabled, spinSound, tickSound, winnerSound],
  );

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new SoundEngine();
      engineRef.current.attachUnlockListeners();
    }

    applySettings(engineRef.current);
    return engineRef.current;
  }, [applySettings]);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = engineOverride ?? new SoundEngine();
      if (!engineOverride) {
        engineRef.current.attachUnlockListeners();
      }
    }

    const engine = engineRef.current;
    return () => {
      engine.detachUnlockListeners();
      if (!engineOverride) {
        engine.dispose();
        engineRef.current = null;
      }
    };
  }, [engineOverride]);

  useEffect(() => {
    if (engineRef.current) {
      applySettings(engineRef.current);
    }
  }, [applySettings]);

  const play = useCallback(
    (id: SoundId) => {
      try {
        return getEngine().play(id);
      } catch {
        return false;
      }
    },
    [getEngine],
  );

  const unlock = useCallback(async () => {
    try {
      return await getEngine().unlock();
    } catch {
      return false;
    }
  }, [getEngine]);

  const previewTimers = useRef<number[]>([]);

  const preview = useCallback(() => {
    for (const timer of previewTimers.current) {
      window.clearTimeout(timer);
    }
    previewTimers.current = SOUND_PREVIEW_ORDER.map((id, index) =>
      window.setTimeout(() => {
        play(id);
      }, index * 280),
    );
  }, [play]);

  useEffect(() => {
    return () => {
      for (const timer of previewTimers.current) {
        window.clearTimeout(timer);
      }
      previewTimers.current = [];
    };
  }, []);

  const value = useMemo(() => ({ play, unlock, preview }), [play, preview, unlock]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}
