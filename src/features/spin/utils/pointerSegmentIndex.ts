import { FULL_TURN, POINTER_ANGLE } from '@/features/spin/constants';

interface AngleSpan {
  startAngle: number;
  endAngle: number;
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function pointerSegmentIndex(
  rotationRadians: number,
  segments: readonly AngleSpan[],
): number {
  if (segments.length === 0) {
    return -1;
  }

  const local = POINTER_ANGLE - rotationRadians;
  const index = segments.findIndex((segment) => angleInSpan(local, segment.startAngle, segment.endAngle));

  return index >= 0 ? index : segments.length - 1;
}

function angleInSpan(angle: number, startAngle: number, endAngle: number): boolean {
  const local = normalizePositive(angle);
  const start = normalizePositive(startAngle);
  const end = normalizePositive(endAngle);

  if (start < end) {
    return local >= start && local < end;
  }

  return local >= start || local < end;
}

function normalizePositive(angle: number): number {
  return ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN;
}
