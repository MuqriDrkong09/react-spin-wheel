import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES, withWheelId } from '@/constants/routes';
import { getPreset, listPresets } from '@/features/presets/data/catalog';
import { toCreateWheelInputFromPreset } from '@/features/presets/utils/clonePreset';
import { persistStores } from '@/services/storage/storePersistence';
import { useWheelStore } from '@/stores/wheelStore';
import type { Wheel, WheelPresetId } from '@/types/wheel';

export function usePresets() {
  const navigate = useNavigate();
  const createWheel = useWheelStore((state) => state.createWheel);
  const setActiveWheel = useWheelStore((state) => state.setActiveWheel);
  const [previewId, setPreviewId] = useState<WheelPresetId | null>(null);

  const presets = useMemo(() => listPresets(), []);
  const preview = previewId ? getPreset(previewId) : undefined;

  function instantiate(presetId: WheelPresetId): Wheel | undefined {
    const preset = getPreset(presetId);
    if (!preset) {
      return undefined;
    }

    const wheel = createWheel(toCreateWheelInputFromPreset(preset));
    setActiveWheel(wheel.id);
    persistStores();
    return wheel;
  }

  function createFromPreset(presetId: WheelPresetId) {
    const wheel = instantiate(presetId);
    if (!wheel) {
      return;
    }

    void navigate(withWheelId(ROUTES.spin, wheel.id));
  }

  function modifyPreset(presetId: WheelPresetId) {
    const wheel = instantiate(presetId);
    if (!wheel) {
      return;
    }

    setPreviewId(null);
    void navigate(withWheelId(ROUTES.wheelEditor, wheel.id));
  }

  function saveAsOwnWheel(presetId: WheelPresetId) {
    const wheel = instantiate(presetId);
    if (!wheel) {
      return;
    }

    setPreviewId(null);
    void navigate(ROUTES.dashboard);
  }

  return {
    presets,
    preview,
    previewPreset: setPreviewId,
    closePreview: () => setPreviewId(null),
    createFromPreset,
    modifyPreset,
    saveAsOwnWheel,
  };
}
