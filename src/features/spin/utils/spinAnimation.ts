import {
  DEFAULT_SPIN_ANIMATION,
  SPIN_EASINGS,
  type SpinAnimationType,
} from '@/features/spin/constants';
import type { SpinAnimationSettings } from '@/features/spin/utils/spinLifecycle';
import type { WheelSettings } from '@/types/wheel';

export function spinSettingsFromWheel(settings: WheelSettings): SpinAnimationSettings {
  return resolveFromWheel(settings);
}

export function animationDurationSeconds(
  settings: Pick<SpinAnimationSettings, 'spinDuration'>,
  reducedMotion: boolean,
): number {
  return spinDiscDurationSeconds(settings.spinDuration, { reducedMotion, spinning: true });
}

export function spinDiscDurationSeconds(
  spinDurationMs: number,
  options: { reducedMotion: boolean; spinning: boolean },
): number {
  if (options.reducedMotion || !options.spinning) {
    return 0;
  }

  return spinDurationMs / 1000;
}

export function animationEasing(type: SpinAnimationType): readonly [number, number, number, number] {
  return SPIN_EASINGS[type] ?? SPIN_EASINGS[DEFAULT_SPIN_ANIMATION.animationType];
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function resolveFromWheel(settings: WheelSettings): SpinAnimationSettings {
  return {
    spinDuration: settings.durationMs,
    rotations: settings.minRotations,
    animationType: DEFAULT_SPIN_ANIMATION.animationType,
  };
}

export function extraRotationRange(settings: WheelSettings): {
  minRotations: number;
  maxRotations: number;
} {
  return {
    minRotations: settings.minRotations,
    maxRotations: settings.maxRotations,
  };
}

