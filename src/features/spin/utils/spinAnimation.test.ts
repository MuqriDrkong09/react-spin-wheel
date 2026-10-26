import { DEFAULT_SPIN_ANIMATION, SPIN_ANIMATION_TYPE, SPIN_EASINGS } from '@/features/spin/constants';
import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import {
  animationDurationSeconds,
  animationEasing,
  extraRotationRange,
  prefersReducedMotion,
  radiansToDegrees,
  spinSettingsFromWheel,
} from '@/features/spin/utils/spinAnimation';

describe('spinAnimation', () => {
  it('maps wheel settings to spinDuration, rotations, and animationType', () => {
    expect(
      spinSettingsFromWheel({
        ...DEFAULT_WHEEL_SETTINGS,
        durationMs: 3200,
        minRotations: 5,
      }),
    ).toEqual({
      spinDuration: 3200,
      rotations: 5,
      animationType: DEFAULT_SPIN_ANIMATION.animationType,
    });
  });

  it('uses zero duration when reduced motion is preferred', () => {
    expect(animationDurationSeconds({ spinDuration: 4000 }, true)).toBe(0);
    expect(animationDurationSeconds({ spinDuration: 4000 }, false)).toBe(4);
  });

  it('returns the cubic bezier for each animation type', () => {
    expect(animationEasing(SPIN_ANIMATION_TYPE.easeOut)).toEqual(SPIN_EASINGS.easeOut);
    expect(animationEasing(SPIN_ANIMATION_TYPE.easeInOut)).toEqual(SPIN_EASINGS.easeInOut);
    expect(animationEasing(SPIN_ANIMATION_TYPE.cubic)).toEqual(SPIN_EASINGS.cubic);
  });

  it('converts engine radians to CSS degrees', () => {
    expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
  });

  it('keeps the wheel min/max rotation range', () => {
    expect(extraRotationRange({ ...DEFAULT_WHEEL_SETTINGS, minRotations: 3, maxRotations: 7 })).toEqual({
      minRotations: 3,
      maxRotations: 7,
    });
  });

  it('reads prefers-reduced-motion from matchMedia', () => {
    const original = window.matchMedia;
    window.matchMedia = (query: string): MediaQueryList => ({
      ...original(query),
      matches: query.includes('prefers-reduced-motion: reduce'),
    });

    expect(prefersReducedMotion()).toBe(true);

    window.matchMedia = original;
    expect(prefersReducedMotion()).toBe(false);
  });
});
