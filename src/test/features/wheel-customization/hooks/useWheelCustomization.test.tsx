import { act, renderHook } from '@testing-library/react';

import { useWheelCustomization } from '@/features/wheel-customization/hooks/useWheelCustomization';
import { persistStores } from '@/services/storage/storePersistence';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { WHEEL_SIZE, WHEEL_THEME } from '@/types/wheel';

vi.mock('@/services/storage/storePersistence', () => ({
  persistStores: vi.fn(),
}));

function useLiveCustomization() {
  const wheel = useWheelStore((state) => state.wheels.find((entry) => entry.id === 'pizza'));
  return useWheelCustomization(wheel!);
}

describe('useWheelCustomization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(persistStores).mockClear();
    resetWheelStore();
    useWheelStore.getState().createWheel({ id: 'pizza', name: 'Pizza Night' });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('resolves appearance from the wheel and commits a title', () => {
    const { result } = renderHook(() => useLiveCustomization());

    expect(result.current.appearance.title).toBe('');
    expect(result.current.appearance.theme).toBe(WHEEL_THEME.classic);

    act(() => {
      result.current.commit({ title: 'Dinner' });
    });

    expect(useWheelStore.getState().getWheel('pizza')?.settings.appearance.title).toBe('Dinner');
    expect(persistStores).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(persistStores).toHaveBeenCalledTimes(1);
  });

  it('can skip persistence or persist immediately', () => {
    const { result } = renderHook(() => useLiveCustomization());

    act(() => {
      result.current.commit({ pointerColor: '#22d3ee' }, { persist: 'none' });
    });
    expect(useWheelStore.getState().getWheel('pizza')?.settings.appearance.pointerColor).toBe(
      '#22d3ee',
    );
    expect(persistStores).not.toHaveBeenCalled();

    act(() => {
      result.current.commit({ background: '#020617' }, { persist: 'now' });
    });
    expect(persistStores).toHaveBeenCalledTimes(1);
  });

  it('replaces a pending persist timer and flushes on unmount', () => {
    const { result, unmount } = renderHook(() => useLiveCustomization());

    act(() => {
      result.current.commit({ title: 'First' });
      result.current.commit({ title: 'Second' });
    });

    expect(persistStores).not.toHaveBeenCalled();

    act(() => {
      result.current.persistNow();
    });
    expect(persistStores).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.commit({ title: 'Pending' });
    });
    unmount();
    expect(persistStores).toHaveBeenCalledTimes(2);
  });

  it('does not flush persistence on unmount when nothing is pending', () => {
    const { unmount } = renderHook(() => useLiveCustomization());

    unmount();
    expect(persistStores).not.toHaveBeenCalled();
  });

  it('applies a named theme now and ignores custom', () => {
    const { result } = renderHook(() => useLiveCustomization());

    act(() => {
      result.current.commit({ title: 'Dinner', size: WHEEL_SIZE.lg }, { persist: 'none' });
    });
    act(() => {
      result.current.applyTheme(WHEEL_THEME.neon);
    });

    const next = useWheelStore.getState().getWheel('pizza')?.settings.appearance;
    expect(next?.theme).toBe(WHEEL_THEME.neon);
    expect(next?.title).toBe('Dinner');
    expect(next?.size).toBe(WHEEL_SIZE.lg);
    expect(persistStores).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.applyTheme(WHEEL_THEME.custom as never);
    });
    expect(useWheelStore.getState().getWheel('pizza')?.settings.appearance.theme).toBe(WHEEL_THEME.neon);
    expect(persistStores).toHaveBeenCalledTimes(1);
  });
});
