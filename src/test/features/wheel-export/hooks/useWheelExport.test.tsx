import { act, renderHook } from '@testing-library/react';

import { EXPORT_MESSAGES } from '@/features/wheel-export/constants';
import { useWheelExport } from '@/features/wheel-export/hooks/useWheelExport';
import { downloadJsonFile } from '@/features/wheel-export/utils/downloadJsonFile';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';

vi.mock('@/features/wheel-export/utils/downloadJsonFile', () => ({
  downloadJsonFile: vi.fn(),
}));

const downloadJsonFileMock = vi.mocked(downloadJsonFile);

describe('useWheelExport', () => {
  beforeEach(() => {
    resetWheelStore();
    downloadJsonFileMock.mockReset();
  });

  it('downloads a valid wheel and reports success', () => {
    useWheelStore.getState().createWheel({
      id: 'food',
      name: 'Food Picker',
      items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
    });
    const { result } = renderHook(() => useWheelExport());

    act(() => {
      expect(result.current.exportWheelById('food')).toBe(true);
    });

    expect(downloadJsonFileMock).toHaveBeenCalledWith(
      'food-picker-wheel.json',
      expect.stringContaining('"name": "Food Picker"'),
    );
    expect(result.current.status).toEqual({
      severity: 'success',
      message: EXPORT_MESSAGES.success('Food Picker', 'food-picker-wheel.json'),
    });

    act(() => {
      result.current.clearStatus();
    });
    expect(result.current.status).toBeNull();
  });

  it('reports a missing wheel without downloading', () => {
    const { result } = renderHook(() => useWheelExport());

    act(() => {
      expect(result.current.exportWheelById('missing')).toBe(false);
    });

    expect(downloadJsonFileMock).not.toHaveBeenCalled();
    expect(result.current.status).toEqual({
      severity: 'error',
      message: EXPORT_MESSAGES.notFound,
    });
  });

  it('reports invalid wheel data without downloading', () => {
    const wheel = useWheelStore.getState().createWheel({
      id: 'empty',
      name: 'Empty',
    });
    const { result } = renderHook(() => useWheelExport());

    act(() => {
      expect(result.current.exportWheel(wheel)).toBe(false);
    });

    expect(downloadJsonFileMock).not.toHaveBeenCalled();
    expect(result.current.status).toEqual({
      severity: 'error',
      message: EXPORT_MESSAGES.itemsRequired,
    });
  });
});
