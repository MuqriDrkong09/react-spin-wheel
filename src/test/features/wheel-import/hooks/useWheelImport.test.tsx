import { act, renderHook } from '@testing-library/react';
import type { DragEvent } from 'react';

import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { IMPORT_MESSAGES } from '@/features/wheel-import/constants';
import { useWheelImport } from '@/features/wheel-import/hooks/useWheelImport';
import { persistStores } from '@/services/storage/storePersistence';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';

vi.mock('@/services/storage/storePersistence', () => ({
  persistStores: vi.fn(),
}));

const persistStoresMock = vi.mocked(persistStores);

function validFile(name = 'Food Picker') {
  return new File(
    [
      JSON.stringify({
        format: WHEEL_EXPORT_FORMAT,
        version: WHEEL_EXPORT_VERSION,
        id: 'imported-wheel',
        name,
        items: [{ id: 'pizza', name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
        settings: DEFAULT_WHEEL_SETTINGS,
      }),
    ],
    'food-picker-wheel.json',
    { type: 'application/json' },
  );
}

describe('useWheelImport', () => {
  beforeEach(() => {
    resetWheelStore();
    persistStoresMock.mockReset();
  });

  it('opens a rename dialog for valid json and imports with new ids', async () => {
    useWheelStore.getState().createWheel({ id: 'imported-wheel', name: 'Food Picker' });
    const { result } = renderHook(() => useWheelImport());

    await act(async () => {
      await result.current.importFile(validFile());
    });

    expect(result.current.pendingDocument?.name).toBe('Food Picker');
    expect(result.current.name).toBe('Food Picker (imported)');

    act(() => {
      result.current.setName('Dinner Wheel');
    });
    act(() => {
      expect(result.current.confirmImport()).toBe(true);
    });

    const imported = useWheelStore.getState().wheels.find((wheel) => wheel.name === 'Dinner Wheel');
    expect(imported?.id).not.toBe('imported-wheel');
    expect(imported?.items[0]?.id).not.toBe('pizza');
    expect(imported?.items[0]?.name).toBe('Pizza');
    expect(persistStoresMock).toHaveBeenCalledTimes(1);
    expect(result.current.status).toEqual({
      severity: 'success',
      message: IMPORT_MESSAGES.success('Dinner Wheel'),
    });
    expect(result.current.pendingDocument).toBeNull();
  });

  it('shows an error for malformed json and does not create a wheel', async () => {
    const { result } = renderHook(() => useWheelImport());

    await act(async () => {
      await result.current.importFile(new File(['{'], 'bad.json'));
    });

    expect(result.current.status).toEqual({
      severity: 'error',
      message: IMPORT_MESSAGES.malformed,
    });
    expect(useWheelStore.getState().wheels).toHaveLength(0);
    expect(persistStoresMock).not.toHaveBeenCalled();
  });

  it('requires a name before confirming', async () => {
    const { result } = renderHook(() => useWheelImport());

    await act(async () => {
      await result.current.importFile(validFile());
    });

    act(() => {
      result.current.setName('   ');
    });
    act(() => {
      expect(result.current.confirmImport()).toBe(false);
    });

    expect(result.current.nameError).toBe(IMPORT_MESSAGES.nameRequired);
    expect(useWheelStore.getState().wheels).toHaveLength(0);
  });

  it('cancels a pending import and tracks drag state', async () => {
    const { result } = renderHook(() => useWheelImport());
    const preventDefault = vi.fn();

    act(() => {
      result.current.onDragEnter({ preventDefault } as unknown as DragEvent);
      result.current.onDragOver({
        preventDefault,
        dataTransfer: { dropEffect: 'none' },
      } as unknown as DragEvent);
    });
    expect(result.current.dragging).toBe(true);

    act(() => {
      result.current.onDragLeave({ preventDefault } as unknown as DragEvent);
    });
    expect(result.current.dragging).toBe(false);

    act(() => {
      result.current.cancelImport();
      result.current.clearStatus();
    });
    expect(result.current.pendingDocument).toBeNull();
    expect(result.current.status).toBeNull();
  });

  it('ignores a missing file', async () => {
    const { result } = renderHook(() => useWheelImport());

    await act(async () => {
      await result.current.importFile(undefined);
    });

    expect(result.current.pendingDocument).toBeNull();
    expect(result.current.status).toBeNull();
  });

  it('does nothing when confirming without a pending document', async () => {
    const { result } = renderHook(() => useWheelImport());

    act(() => {
      expect(result.current.confirmImport()).toBe(false);
    });

    expect(persistStoresMock).not.toHaveBeenCalled();
  });
});
