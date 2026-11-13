import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent, DragEvent } from 'react';

import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { IMPORT_MESSAGES } from '@/features/wheel-import/constants';
import { useWheelImport } from '@/features/wheel-import/hooks/useWheelImport';
import * as parseImportedWheel from '@/features/wheel-import/utils/parseImportedWheel';
import * as toCreateWheelInputFromImport from '@/features/wheel-import/utils/toCreateWheelInputFromImport';
import { persistStores } from '@/services/storage/storePersistence';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import * as sanitizeWheelHierarchy from '@/utils/sanitizeWheelHierarchy';

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

function dragEvent(overrides: Record<string, unknown> = {}): DragEvent {
  return {
    preventDefault: vi.fn(),
    dataTransfer: { dropEffect: 'none', files: [] },
    ...overrides,
  } as unknown as DragEvent;
}

describe('useWheelImport', () => {
  beforeEach(() => {
    resetWheelStore();
    persistStoresMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('cancels a pending import and tracks nested drag state', async () => {
    const { result } = renderHook(() => useWheelImport());
    const preventDefault = vi.fn();

    act(() => {
      result.current.onDragEnter({ preventDefault } as unknown as DragEvent);
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

  it('opens the hidden file input when present', () => {
    const { result } = renderHook(() => useWheelImport());
    const click = vi.fn();

    act(() => {
      result.current.openFilePicker();
    });

    Object.defineProperty(result.current.inputRef, 'current', {
      configurable: true,
      value: { click },
    });

    act(() => {
      result.current.openFilePicker();
    });
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('imports from an input change event', async () => {
    const { result } = renderHook(() => useWheelImport());
    const input = document.createElement('input');
    const file = validFile('From Input');
    Object.defineProperty(input, 'files', { value: [file] });
    input.value = 'C:\\fakepath\\from-input.json';

    await act(async () => {
      result.current.onInputChange({
        target: input,
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(input.value).toBe('');
    expect(result.current.pendingDocument?.name).toBe('From Input');
  });

  it('imports a dropped file and clears dragging', async () => {
    const { result } = renderHook(() => useWheelImport());
    const preventDefault = vi.fn();
    const file = validFile('Dropped');

    act(() => {
      result.current.onDragEnter(dragEvent({ preventDefault }));
    });
    expect(result.current.dragging).toBe(true);

    await act(async () => {
      result.current.onDrop(
        dragEvent({
          preventDefault,
          dataTransfer: {
            files: {
              length: 1,
              item: (index: number) => (index === 0 ? file : null),
              0: file,
            },
          },
        }),
      );
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.dragging).toBe(false);
    expect(result.current.pendingDocument?.name).toBe('Dropped');
  });

  it('falls back to files indexing when item() is unavailable', async () => {
    const { result } = renderHook(() => useWheelImport());
    const file = validFile('Indexed Drop');

    await act(async () => {
      result.current.onDrop(
        dragEvent({
          dataTransfer: {
            files: {
              length: 1,
              0: file,
            },
          },
        }),
      );
    });

    expect(result.current.pendingDocument?.name).toBe('Indexed Drop');
  });

  it('reports importFailed when parsing throws unexpectedly', async () => {
    vi.spyOn(parseImportedWheel, 'parseImportedWheelFile').mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useWheelImport());

    await act(async () => {
      await result.current.importFile(validFile());
    });

    expect(result.current.pendingDocument).toBeNull();
    expect(result.current.status).toEqual({
      severity: 'error',
      message: APP_ERROR_MESSAGES.importFailed,
    });
  });

  it('persists a repaired hierarchy after import', async () => {
    useWheelStore.getState().createWheel({ id: 'existing', name: 'Existing Wheel' });
    vi.spyOn(sanitizeWheelHierarchy, 'sanitizeWheelHierarchy').mockImplementation((wheel) => ({
      value: { ...wheel, name: `${wheel.name} Fixed` },
      repaired: true,
    }));

    const { result } = renderHook(() => useWheelImport());

    await act(async () => {
      await result.current.importFile(validFile('Needs Repair'));
    });
    act(() => {
      expect(result.current.confirmImport()).toBe(true);
    });

    const wheels = useWheelStore.getState().wheels;
    expect(wheels.some((wheel) => wheel.name === 'Existing Wheel')).toBe(true);
    expect(wheels.some((wheel) => wheel.name === 'Needs Repair Fixed')).toBe(true);
    expect(result.current.status).toEqual({
      severity: 'success',
      message: IMPORT_MESSAGES.success('Needs Repair Fixed'),
    });
    expect(persistStoresMock).toHaveBeenCalled();
  });

  it('reports importFailed when confirm cannot create the wheel', async () => {
    const { result } = renderHook(() => useWheelImport());

    await act(async () => {
      await result.current.importFile(validFile('Broken Confirm'));
    });

    vi.spyOn(toCreateWheelInputFromImport, 'toCreateWheelInputFromImport').mockImplementationOnce(() => {
      throw new Error('create failed');
    });

    let confirmed = true;
    act(() => {
      confirmed = result.current.confirmImport();
    });

    expect(confirmed).toBe(false);
    expect(result.current.status).toEqual({
      severity: 'error',
      message: APP_ERROR_MESSAGES.importFailed,
    });
    expect(persistStoresMock).not.toHaveBeenCalled();
  });
});
