import { act, renderHook } from '@testing-library/react';

import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { SPIN_ANIMATION_TYPE, SPIN_STATUS } from '@/features/spin/constants';
import { useSpinWheel } from '@/features/spin/hooks/useSpinWheel';
import type { WheelItem } from '@/types/wheel';

function item(name: string, extra?: Partial<WheelItem>): WheelItem {
  return {
    id: name.toLowerCase(),
    name,
    color: '#4f46e5',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

const food = [
  item('Pizza', { color: '#ea580c', weight: 1 }),
  item('Burger', { color: '#ca8a04', weight: 2 }),
  item('Sushi', { color: '#0f766e', weight: 1 }),
];

describe('useSpinWheel', () => {
  it('walks idle → spinning → completed and blocks duplicate spins', () => {
    const randomValue = vi.fn(() => 0.5);
    const { result } = renderHook(() =>
      useSpinWheel(food, {
        randomValue,
        reducedMotion: false,
        spinDuration: 2500,
        rotations: 5,
        animationType: SPIN_ANIMATION_TYPE.cubic,
      }),
    );

    expect(result.current.status).toBe(SPIN_STATUS.idle);
    expect(result.current.spinning).toBe(false);

    act(() => {
      result.current.spin();
      result.current.spin();
    });

    expect(result.current.status).toBe(SPIN_STATUS.spinning);
    expect(result.current.spinning).toBe(true);
    expect(result.current.result?.item.name).toBe('Burger');
    expect(randomValue).toHaveBeenCalledTimes(1);
    expect(result.current.animation).toEqual({
      spinDuration: 2500,
      rotations: 5,
      animationType: SPIN_ANIMATION_TYPE.cubic,
    });

    act(() => {
      result.current.complete();
    });

    expect(result.current.status).toBe(SPIN_STATUS.completed);
    expect(result.current.spinning).toBe(false);
    expect(result.current.selectedColor).toBe('#ca8a04');
    expect(result.current.rotation).toBeGreaterThan(0);
  });

  it('jumps to completed when reduced motion is preferred', () => {
    const { result } = renderHook(() =>
      useSpinWheel(food, { randomValue: 0, reducedMotion: true, rotations: 4 }),
    );

    act(() => {
      result.current.spin();
    });

    expect(result.current.status).toBe(SPIN_STATUS.completed);
    expect(result.current.result?.item.name).toBe('Pizza');
    expect(result.current.durationSeconds).toBe(0);
  });

  it('keeps adding rotation on the next spin', () => {
    const { result } = renderHook(() =>
      useSpinWheel(food, { randomValue: 0.5, reducedMotion: false, rotations: 4 }),
    );

    act(() => {
      result.current.spin();
    });
    const firstTarget = result.current.rotation;
    act(() => {
      result.current.complete();
    });
    act(() => {
      result.current.spin();
    });

    expect(result.current.status).toBe(SPIN_STATUS.spinning);
    expect(result.current.rotation).toBeGreaterThan(firstTarget);
  });

  it('resets to idle at 0 so the next spin is a new animation', () => {
    const { result } = renderHook(() =>
      useSpinWheel(food, { randomValue: 0, reducedMotion: false, rotations: 4 }),
    );

    act(() => {
      result.current.spin();
    });
    act(() => {
      result.current.complete();
    });
    expect(result.current.rotation).toBeGreaterThan(0);

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe(SPIN_STATUS.idle);
    expect(result.current.spinning).toBe(false);
    expect(result.current.rotation).toBe(0);

    act(() => {
      result.current.spin();
    });

    expect(result.current.status).toBe(SPIN_STATUS.spinning);
    expect(result.current.rotation).toBeGreaterThan(0);
  });

  it('starts a child-level spin from a fresh rotation', () => {
    const children = [item('Pepperoni', { color: '#dc2626' }), item('Mushroom', { color: '#ca8a04' })];
    const { result } = renderHook(() =>
      useSpinWheel(food, { randomValue: 0, reducedMotion: true, rotations: 4 }),
    );

    act(() => {
      result.current.spin();
    });
    expect(result.current.result?.item.name).toBe('Pizza');

    act(() => {
      result.current.spinChildren(children);
    });

    expect(result.current.status).toBe(SPIN_STATUS.completed);
    expect(result.current.result?.item.name).toBe('Pepperoni');
  });

  it('stays idle when there is nothing to spin', () => {
    const { result } = renderHook(() =>
      useSpinWheel([item('Pizza', { enabled: false })], {
        randomValue: 0,
        reducedMotion: false,
      }),
    );

    act(() => {
      result.current.spin();
    });
    expect(result.current.status).toBe(SPIN_STATUS.idle);
    expect(result.current.result).toBeUndefined();
    expect(result.current.selectedColor).toBeUndefined();

    act(() => {
      result.current.spinChildren([]);
    });
    expect(result.current.status).toBe(SPIN_STATUS.idle);
  });

  it('reads animation and rotation range from wheel settings', () => {
    const { result } = renderHook(() =>
      useSpinWheel(food, {
        randomValue: 0,
        reducedMotion: true,
        wheelSettings: {
          ...DEFAULT_WHEEL_SETTINGS,
          durationMs: 2500,
          minRotations: 2,
          maxRotations: 2,
        },
      }),
    );

    expect(result.current.animation).toEqual({
      spinDuration: 2500,
      rotations: 2,
      animationType: SPIN_ANIMATION_TYPE.easeInOut,
    });

    act(() => {
      result.current.spin();
    });

    expect(result.current.status).toBe(SPIN_STATUS.completed);
    expect(result.current.result?.fullRotations).toBe(2);
    expect(result.current.rotationDegrees).toBeGreaterThan(0);
  });

  it('uses a separate rotation-random sample', () => {
    const { result } = renderHook(() =>
      useSpinWheel(food, {
        randomValue: 0,
        rotationRandom: 1,
        reducedMotion: true,
        wheelSettings: {
          ...DEFAULT_WHEEL_SETTINGS,
          minRotations: 4,
          maxRotations: 8,
        },
      }),
    );

    act(() => {
      result.current.spin();
    });

    expect(result.current.result?.item.name).toBe('Pizza');
    expect(result.current.result?.fullRotations).toBe(8);
  });

  it('uses Math.random and prefers-reduced-motion when options are omitted', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { result } = renderHook(() => useSpinWheel(food));

    expect(result.current.reducedMotion).toBe(true);

    act(() => {
      result.current.spin();
    });

    expect(random).toHaveBeenCalled();
    expect(result.current.status).toBe(SPIN_STATUS.completed);
    expect(result.current.result?.item.name).toBe('Burger');

    random.mockRestore();
    window.matchMedia = originalMatchMedia;
  });
});
