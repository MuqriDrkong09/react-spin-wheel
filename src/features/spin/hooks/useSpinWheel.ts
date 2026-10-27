import { useRef, useState } from 'react';

import { SPIN_STATUS } from '@/features/spin/constants';
import { createSpinResult } from '@/features/spin/engine/spinEngine';
import {
  animationDurationSeconds,
  animationEasing,
  prefersReducedMotion,
  radiansToDegrees,
  spinSettingsFromWheel,
} from '@/features/spin/utils/spinAnimation';
import {
  canStartSpin,
  createIdleSpinState,
  displayedRotation,
  finishSpin,
  resolveSpinAnimationSettings,
  startSpin,
  type SpinAnimationSettings,
  type SpinLifecycleState,
} from '@/features/spin/utils/spinLifecycle';
import type { WheelItem, WheelSettings } from '@/types/wheel';
import type { RandomValue } from '@/utils/selectWeightedItem';

interface UseSpinWheelOptions extends Partial<SpinAnimationSettings> {
  wheelSettings?: WheelSettings;
  randomValue?: RandomValue;
  rotationRandom?: RandomValue;
  reducedMotion?: boolean;
}

export function useSpinWheel(items: readonly WheelItem[], options: UseSpinWheelOptions = {}) {
  const [state, setState] = useState<SpinLifecycleState>(() => createIdleSpinState());
  const stateRef = useRef(state);

  const animation = resolveSpinAnimationSettings(
    options.wheelSettings
      ? { ...spinSettingsFromWheel(options.wheelSettings), ...options }
      : options,
  );
  const reducedMotion = options.reducedMotion ?? prefersReducedMotion();
  const minRotations = options.wheelSettings?.minRotations ?? animation.rotations;
  const maxRotations = options.wheelSettings?.maxRotations ?? animation.rotations;

  function spin() {
    return beginSpin(items, stateRef.current);
  }

  function spinChildren(nextItems: readonly WheelItem[]) {
    return beginSpin(nextItems, createIdleSpinState());
  }

  function beginSpin(
    source: readonly WheelItem[],
    current: SpinLifecycleState,
  ): SpinLifecycleState {
    if (!canStartSpin(current)) {
      return current;
    }

    const sample = options.randomValue ?? Math.random;
    const next = createSpinResult(source, {
      randomValue: sample,
      minRotations,
      maxRotations,
      rotationRandom: options.rotationRandom ?? sample,
      currentRotation: current.rotation,
    });
    const started = startSpin(current, next);
    if (started === current) {
      return current;
    }

    const nextState = reducedMotion ? finishSpin(started) : started;
    stateRef.current = nextState;
    setState(nextState);
    return nextState;
  }

  function complete() {
    const nextState = finishSpin(stateRef.current);
    stateRef.current = nextState;
    setState(nextState);
    return nextState;
  }

  function reset() {
    const nextState = createIdleSpinState();
    stateRef.current = nextState;
    setState(nextState);
  }

  const spinning = state.status === SPIN_STATUS.spinning;
  const selectedColor =
    state.status === SPIN_STATUS.completed ? state.result?.item.color : undefined;

  return {
    status: state.status,
    spinning,
    rotation: displayedRotation(state),
    rotationDegrees: radiansToDegrees(displayedRotation(state)),
    result: state.result,
    selectedColor,
    animation,
    durationSeconds: animationDurationSeconds(animation, reducedMotion),
    easing: animationEasing(animation.animationType),
    reducedMotion,
    spin,
    spinChildren,
    complete,
    reset,
  };
}
