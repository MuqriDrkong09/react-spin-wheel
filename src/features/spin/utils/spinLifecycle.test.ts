import { FULL_TURN, SPIN_ANIMATION_TYPE, SPIN_STATUS } from '@/features/spin/constants';
import type { SpinEngineResult } from '@/features/spin/engine/spinEngine';
import type { WheelItem } from '@/types/wheel';
import {
  canStartSpin,
  createIdleSpinState,
  displayedRotation,
  finishSpin,
  resetSpin,
  resolveSpinAnimationSettings,
  startSpin,
} from '@/features/spin/utils/spinLifecycle';

function item(name: string): WheelItem {
  return {
    id: name.toLowerCase(),
    name,
    color: '#4f46e5',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function result(rotation: number, name = 'Pizza'): SpinEngineResult {
  const winner = item(name);
  return {
    item: winner,
    segment: {
      item: winner,
      index: 0,
      startAngle: 0,
      endAngle: FULL_TURN,
      sweepAngle: FULL_TURN,
      midAngle: Math.PI,
    },
    rotation,
    targetAngle: Math.PI,
    fullRotations: 4,
  };
}

describe('spin lifecycle', () => {
  it('starts idle', () => {
    const state = createIdleSpinState();

    expect(state.status).toBe(SPIN_STATUS.idle);
    expect(state.rotation).toBe(0);
    expect(state.result).toBeUndefined();
    expect(canStartSpin(state)).toBe(true);
  });

  it('moves idle → spinning → completed', () => {
    const next = result(4 * FULL_TURN);
    const spinning = startSpin(createIdleSpinState(), next);

    expect(spinning.status).toBe(SPIN_STATUS.spinning);
    expect(spinning.rotation).toBe(0);
    expect(spinning.targetRotation).toBe(next.rotation);
    expect(spinning.result?.item).toBe(next.item);
    expect(displayedRotation(spinning)).toBe(next.rotation);
    expect(canStartSpin(spinning)).toBe(false);

    const completed = finishSpin(spinning);

    expect(completed.status).toBe(SPIN_STATUS.completed);
    expect(completed.rotation).toBe(next.rotation);
    expect(completed.result?.item.name).toBe('Pizza');
    expect(canStartSpin(completed)).toBe(true);
  });

  it('ignores a duplicate start while spinning', () => {
    const first = result(4 * FULL_TURN, 'Pizza');
    const second = result(8 * FULL_TURN, 'Burger');
    const spinning = startSpin(createIdleSpinState(), first);

    expect(startSpin(spinning, second)).toBe(spinning);
    expect(spinning.result?.item.name).toBe('Pizza');
  });

  it('ignores start when there is no winner', () => {
    const idle = createIdleSpinState();

    expect(startSpin(idle, undefined)).toBe(idle);
    expect(idle.status).toBe(SPIN_STATUS.idle);
  });

  it('does not complete unless the wheel is spinning', () => {
    const idle = createIdleSpinState(2);
    const completed = finishSpin(startSpin(idle, result(10)));

    expect(finishSpin(idle)).toBe(idle);
    expect(finishSpin(completed)).toBe(completed);
  });

  it('resets to idle without losing the landed rotation', () => {
    const completed = finishSpin(startSpin(createIdleSpinState(), result(12)));
    const idle = resetSpin(completed);

    expect(idle.status).toBe(SPIN_STATUS.idle);
    expect(idle.rotation).toBe(12);
    expect(idle.result).toBeUndefined();
  });

  it('starts the next spin from the previous rotation', () => {
    const first = finishSpin(startSpin(createIdleSpinState(), result(4 * FULL_TURN, 'Pizza')));
    const second = startSpin(first, result(9 * FULL_TURN, 'Burger'));

    expect(second.status).toBe(SPIN_STATUS.spinning);
    expect(second.rotation).toBe(4 * FULL_TURN);
    expect(second.targetRotation).toBe(9 * FULL_TURN);
    expect(second.result?.item.name).toBe('Burger');
    expect(finishSpin(second).rotation).toBe(9 * FULL_TURN);
  });
});

describe('resolveSpinAnimationSettings', () => {
  it('fills spinDuration, rotations, and animationType', () => {
    expect(
      resolveSpinAnimationSettings({
        spinDuration: 2500,
        rotations: 6,
        animationType: SPIN_ANIMATION_TYPE.cubic,
      }),
    ).toEqual({
      spinDuration: 2500,
      rotations: 6,
      animationType: SPIN_ANIMATION_TYPE.cubic,
    });
  });

  it('falls back to defaults for missing or invalid values', () => {
    expect(resolveSpinAnimationSettings({ spinDuration: Number.NaN, rotations: -2 })).toEqual({
      spinDuration: 4000,
      rotations: 4,
      animationType: SPIN_ANIMATION_TYPE.easeInOut,
    });
  });
});
