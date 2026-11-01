import { act, renderHook } from '@testing-library/react';

import { SHARE_MESSAGES } from '@/features/wheel-share/constants';
import { useWheelShare } from '@/features/wheel-share/hooks/useWheelShare';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';

describe('useWheelShare', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    resetWheelStore();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('copies a share link for a valid wheel', async () => {
    useWheelStore.getState().createWheel({
      id: 'food',
      name: 'Food Picker',
      items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
    });
    const { result } = renderHook(() => useWheelShare());

    await act(async () => {
      await expect(result.current.copyShareLinkById('food')).resolves.toBe(true);
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toContain('/share?s=');
    expect(result.current.status).toEqual({
      severity: 'success',
      message: SHARE_MESSAGES.copied('Food Picker'),
    });

    act(() => {
      result.current.clearStatus();
    });
    expect(result.current.status).toBeNull();
  });

  it('reports missing, invalid, and clipboard failures', async () => {
    const { result } = renderHook(() => useWheelShare());

    await act(async () => {
      await expect(result.current.copyShareLinkById('missing')).resolves.toBe(false);
    });
    expect(result.current.status).toEqual({
      severity: 'error',
      message: SHARE_MESSAGES.notFound,
    });

    const empty = useWheelStore.getState().createWheel({ id: 'empty', name: 'Empty' });
    await act(async () => {
      await expect(result.current.copyShareLink(empty)).resolves.toBe(false);
    });
    expect(result.current.status).toEqual({
      severity: 'error',
      message: SHARE_MESSAGES.itemsRequired,
    });

    useWheelStore.getState().createWheel({
      id: 'food',
      name: 'Food Picker',
      items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
    });
    writeText.mockRejectedValueOnce(new Error('denied'));
    await act(async () => {
      await expect(result.current.copyShareLinkById('food')).resolves.toBe(false);
    });
    expect(result.current.status).toEqual({
      severity: 'error',
      message: SHARE_MESSAGES.copyFailed,
    });
  });
});
