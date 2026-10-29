import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { ROUTES, withWheelId } from '@/constants/routes';
import { PRESET_ID } from '@/features/presets/constants';
import { getFrozenPresetCatalog } from '@/features/presets/data/catalog';
import { usePresets } from '@/features/presets/hooks/usePresets';
import { loadPersistedState } from '@/services/storage/persistedState';
import { storageService } from '@/services/storage/storageService';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={[ROUTES.presets]}>{children}</MemoryRouter>;
}

function usePresetsWithLocation() {
  const presets = usePresets();
  const location = useLocation();

  return {
    ...presets,
    href: `${location.pathname}${location.search}`,
  };
}

describe('usePresets', () => {
  beforeEach(() => {
    window.localStorage.clear();
    storageService.clearMemory();
    resetWheelStore();
  });

  it('lists catalog clones and starts without a preview', () => {
    const { result } = renderHook(() => usePresetsWithLocation(), { wrapper });

    expect(result.current.presets.map((preset) => preset.id)).toEqual([
      PRESET_ID.food,
      PRESET_ID.movie,
      PRESET_ID.workout,
      PRESET_ID.team,
    ]);
    expect(result.current.preview).toBeUndefined();
    expect(result.current.href).toBe(ROUTES.presets);
  });

  it('opens and closes a preview without changing the frozen catalog', () => {
    const { result } = renderHook(() => usePresetsWithLocation(), { wrapper });

    act(() => {
      result.current.previewPreset(PRESET_ID.food);
    });

    expect(result.current.preview?.name).toBe('Food');
    expect(result.current.preview?.items[0]?.name).toBe('Pizza');

    const preview = result.current.preview;
    if (preview) {
      preview.name = 'Dinner';
    }

    expect(getFrozenPresetCatalog()[0]?.name).toBe('Food');

    act(() => {
      result.current.closePreview();
    });

    expect(result.current.preview).toBeUndefined();
    expect(useWheelStore.getState().wheels).toHaveLength(0);
  });

  it('creates a copy and opens spin', () => {
    const { result } = renderHook(() => usePresetsWithLocation(), { wrapper });

    act(() => {
      result.current.createFromPreset(PRESET_ID.food);
    });

    const created = useWheelStore.getState().wheels[0];
    expect(created?.name).toBe('Food');
    expect(created?.items.map((item) => item.name)).toEqual(['Pizza', 'Burger', 'Noodles', 'Sushi']);
    expect(useWheelStore.getState().activeWheelId).toBe(created?.id);
    expect(loadPersistedState().wheels[0]?.name).toBe('Food');
    expect(result.current.href).toBe(withWheelId(ROUTES.spin, created?.id ?? ''));
    expect(getFrozenPresetCatalog()[0]?.name).toBe('Food');
  });

  it('closes preview and opens the editor when modifying a preset', () => {
    const { result } = renderHook(() => usePresetsWithLocation(), { wrapper });

    act(() => {
      result.current.previewPreset(PRESET_ID.food);
    });
    act(() => {
      result.current.modifyPreset(PRESET_ID.food);
    });

    const created = useWheelStore.getState().wheels[0];
    expect(result.current.preview).toBeUndefined();
    expect(created?.name).toBe('Food');
    expect(useWheelStore.getState().activeWheelId).toBe(created?.id);
    expect(result.current.href).toBe(withWheelId(ROUTES.wheelEditor, created?.id ?? ''));
  });

  it('closes preview and returns to the dashboard when saving as a user wheel', () => {
    const { result } = renderHook(() => usePresetsWithLocation(), { wrapper });

    act(() => {
      result.current.previewPreset(PRESET_ID.team);
    });
    act(() => {
      result.current.saveAsOwnWheel(PRESET_ID.team);
    });

    const created = useWheelStore.getState().wheels[0];
    expect(result.current.preview).toBeUndefined();
    expect(created?.name).toBe('Team');
    expect(created?.items.map((item) => item.name)).toEqual([
      'Alex Rivera',
      'Jordan Lee',
      'Sam Okonkwo',
      'Taylor Chen',
    ]);
    expect(result.current.href).toBe(ROUTES.dashboard);
  });

  it('does not create or navigate when the preset is missing', () => {
    const { result } = renderHook(() => usePresetsWithLocation(), { wrapper });

    act(() => {
      result.current.previewPreset(PRESET_ID.movie);
    });
    act(() => {
      result.current.createFromPreset('missing-preset');
      result.current.modifyPreset('missing-preset');
      result.current.saveAsOwnWheel('missing-preset');
    });

    expect(result.current.preview?.id).toBe(PRESET_ID.movie);
    expect(useWheelStore.getState().wheels).toHaveLength(0);
    expect(loadPersistedState().wheels).toHaveLength(0);
    expect(result.current.href).toBe(ROUTES.presets);
  });
});
