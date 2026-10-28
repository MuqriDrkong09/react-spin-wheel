import { POINTER_ANGLE } from '@/features/spin/constants';
import { calculateSegmentAngles, calculateTargetRotation } from '@/features/spin/engine/spinEngine';
import type { WheelItem } from '@/types/wheel';

import { pointerSegmentIndex } from './pointerSegmentIndex';

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

describe('pointerSegmentIndex', () => {
  it('returns -1 when there are no segments', () => {
    expect(pointerSegmentIndex(0, [])).toBe(-1);
  });

  it('points at the first segment before the wheel moves', () => {
    const segments = calculateSegmentAngles([item('Pizza'), item('Burger')]);
    expect(pointerSegmentIndex(0, segments)).toBe(0);
    expect(segments[0]?.startAngle).toBeCloseTo(POINTER_ANGLE);
  });

  it('matches the engine landing for a chosen segment', () => {
    const segments = calculateSegmentAngles([item('Pizza'), item('Burger'), item('Sushi')]);
    const burger = segments[1];
    expect(burger).toBeDefined();
    const rotation = calculateTargetRotation(burger!);

    expect(pointerSegmentIndex(rotation, segments)).toBe(1);
  });
});
