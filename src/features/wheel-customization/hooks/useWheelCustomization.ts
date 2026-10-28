import { useEffect, useRef } from 'react';

import { persistStores } from '@/services/storage/storePersistence';
import { useWheelStore } from '@/stores/wheelStore';
import type { Wheel, WheelAppearance, WheelTheme } from '@/types/wheel';
import {
  appearanceFromTheme,
  isNamedWheelTheme,
  mergeAppearance,
  resolveAppearance,
} from '@/features/wheel-customization/utils/appearance';

export function useWheelCustomization(wheel: Wheel) {
  const updateWheelSettings = useWheelStore((state) => state.updateWheelSettings);
  const appearance = resolveAppearance(wheel.settings.appearance);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (persistTimer.current) {
        clearTimeout(persistTimer.current);
        persistStores();
      }
    };
  }, []);

  function persist(now: boolean) {
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
      persistTimer.current = null;
    }

    if (now) {
      persistStores();
      return;
    }

    persistTimer.current = setTimeout(() => {
      persistTimer.current = null;
      persistStores();
    }, 250);
  }

  function commit(patch: Partial<WheelAppearance>, options?: { persist?: 'now' | 'later' | 'none' }) {
    updateWheelSettings(wheel.id, {
      appearance: mergeAppearance(appearance, patch),
    });
    if (options?.persist === 'none') {
      return;
    }
    persist(options?.persist === 'now');
  }

  function applyTheme(theme: Exclude<WheelTheme, 'custom'>) {
    if (!isNamedWheelTheme(theme)) {
      return;
    }

    commit(appearanceFromTheme(theme, { title: appearance.title, size: appearance.size }), {
      persist: 'now',
    });
  }

  return {
    appearance,
    commit,
    persistNow: () => persist(true),
    applyTheme,
  };
}
