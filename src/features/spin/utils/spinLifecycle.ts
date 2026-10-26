import {
  DEFAULT_SPIN_ANIMATION,
  SPIN_STATUS,
  type SpinAnimationType,
  type SpinStatus,
} from '@/features/spin/constants';
import type { SpinEngineResult } from '@/features/spin/engine/spinEngine';

export interface SpinAnimationSettings {
  spinDuration: number;
  rotations: number;
  animationType: SpinAnimationType;
}

export interface SpinLifecycleState {
  status: SpinStatus;
  rotation: number;
  targetRotation: number;
  result?: SpinEngineResult;
}

export function createIdleSpinState(rotation = 0): SpinLifecycleState {
  return {
    status: SPIN_STATUS.idle,
    rotation,
    targetRotation: rotation,
  };
}

export function startSpin(
  state: SpinLifecycleState,
  result: SpinEngineResult | undefined,
): SpinLifecycleState {
  if (state.status === SPIN_STATUS.spinning || !result) {
    return state;
  }

  return {
    status: SPIN_STATUS.spinning,
    rotation: state.rotation,
    targetRotation: result.rotation,
    result,
  };
}

export function finishSpin(state: SpinLifecycleState): SpinLifecycleState {
  if (state.status !== SPIN_STATUS.spinning) {
    return state;
  }

  return {
    status: SPIN_STATUS.completed,
    rotation: state.targetRotation,
    targetRotation: state.targetRotation,
    result: state.result,
  };
}

export function resetSpin(state: SpinLifecycleState): SpinLifecycleState {
  return createIdleSpinState(state.rotation);
}

export function displayedRotation(state: SpinLifecycleState): number {
  return state.status === SPIN_STATUS.spinning ? state.targetRotation : state.rotation;
}

export function canStartSpin(state: SpinLifecycleState): boolean {
  return state.status !== SPIN_STATUS.spinning;
}

export function resolveSpinAnimationSettings(
  input: Partial<SpinAnimationSettings> = {},
): SpinAnimationSettings {
  return {
    spinDuration: finiteOrDefault(input.spinDuration, DEFAULT_SPIN_ANIMATION.spinDuration),
    rotations: finiteOrDefault(input.rotations, DEFAULT_SPIN_ANIMATION.rotations),
    animationType: input.animationType ?? DEFAULT_SPIN_ANIMATION.animationType,
  };
}

function finiteOrDefault(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : fallback;
}
