import { act, renderHook } from '@testing-library/react';

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
});
