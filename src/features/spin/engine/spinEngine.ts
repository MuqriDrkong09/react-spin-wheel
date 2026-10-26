import {
  DEFAULT_FULL_ROTATIONS,
  FULL_TURN,
  POINTER_ANGLE,
} from '@/features/spin/constants';
import type { WheelItem } from '@/types/wheel';
import {
  selectWeightedItem,
  type RandomValue,
  WEIGHTED_SELECTION_ERRORS,
} from '@/utils/selectWeightedItem';

export const SPIN_ENGINE_ERRORS = {
  invalidFullRotations: 'Full rotations must be a finite number of 0 or more.',
  invalidLanding: 'Landing must be a finite number between 0 and 1.',
  invalidCurrentRotation: 'Current rotation must be a finite number.',
  invalidRotationRange: 'minRotations cannot be greater than maxRotations.',
} as const;

export interface SegmentAngle {
  item: WheelItem;
  index: number;
  startAngle: number;
  endAngle: number;
  sweepAngle: number;
  midAngle: number;
}

export interface TargetRotationOptions {
  pointerAngle?: number;
  fullRotations?: number;
  currentRotation?: number;
  landing?: number;
}

export interface CreateSpinResultOptions {
  randomValue: RandomValue;
  fullRotations?: number;
  minRotations?: number;
  maxRotations?: number;
  rotationRandom?: RandomValue;
  currentRotation?: number;
  landing?: number;
  pointerAngle?: number;
}

export interface SpinEngineResult {
  item: WheelItem;
  segment: SegmentAngle;
  rotation: number;
  targetAngle: number;
  fullRotations: number;
}

export function isActiveWheelSegment(item: WheelItem): boolean {
  return item.enabled && Number.isFinite(item.weight) && item.weight > 0;
}

export function activeWheelItems(items: readonly WheelItem[]): WheelItem[] {
  return items.filter(isActiveWheelSegment);
}

export function calculateSegmentAngles(items: readonly WheelItem[]): SegmentAngle[] {
  const activeItems = activeWheelItems(items);
  const totalWeight = activeItems.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    return [];
  }

  const segments: SegmentAngle[] = [];
  let cursor = POINTER_ANGLE;

  for (const [index, item] of activeItems.entries()) {
    const sweepAngle = (item.weight / totalWeight) * FULL_TURN;
    const startAngle = cursor;
    const endAngle = cursor + sweepAngle;

    segments.push({
      item,
      index,
      startAngle,
      endAngle,
      sweepAngle,
      midAngle: startAngle + sweepAngle / 2,
    });

    cursor = endAngle;
  }

  return segments;
}

export function selectWinner(
  items: readonly WheelItem[],
  randomValue: RandomValue,
): WheelItem | undefined {
  return selectWeightedItem(activeWheelItems(items), randomValue);
}

export function calculateTargetRotation(
  segment: Pick<SegmentAngle, 'startAngle' | 'endAngle'>,
  options: TargetRotationOptions = {},
): number {
  const pointerAngle = options.pointerAngle ?? POINTER_ANGLE;
  const fullRotations = options.fullRotations ?? DEFAULT_FULL_ROTATIONS;
  const currentRotation = options.currentRotation ?? 0;
  const landing = options.landing ?? 0.5;

  assertFullRotations(fullRotations);
  assertLanding(landing);
  assertCurrentRotation(currentRotation);

  const targetAngle = landingAngle(segment, landing);
  const aligned = normalizePositive(pointerAngle - targetAngle);
  const minimum = currentRotation + fullRotations * FULL_TURN;
  const wraps = Math.ceil((minimum - aligned) / FULL_TURN - 1e-9);

  return aligned + Math.max(0, wraps) * FULL_TURN;
}

export function createSpinResult(
  items: readonly WheelItem[],
  options: CreateSpinResultOptions,
): SpinEngineResult | undefined {
  const winner = selectWinner(items, options.randomValue);
  if (!winner) {
    return undefined;
  }

  const segment = calculateSegmentAngles(items).find((entry) => entry.item === winner);
  if (!segment) {
    return undefined;
  }

  const fullRotations = resolveFullRotations(options);
  const landing = options.landing ?? 0.5;
  const rotation = calculateTargetRotation(segment, {
    fullRotations,
    currentRotation: options.currentRotation,
    landing,
    pointerAngle: options.pointerAngle,
  });

  return {
    item: winner,
    segment,
    rotation,
    targetAngle: landingAngle(segment, landing),
    fullRotations,
  };
}

export function landingAngle(
  segment: Pick<SegmentAngle, 'startAngle' | 'endAngle'>,
  landing = 0.5,
): number {
  return segment.startAngle + (segment.endAngle - segment.startAngle) * landing;
}

function resolveFullRotations(options: CreateSpinResultOptions): number {
  if (options.fullRotations !== undefined) {
    assertFullRotations(options.fullRotations);
    return options.fullRotations;
  }

  const minRotations = options.minRotations ?? DEFAULT_FULL_ROTATIONS;
  const maxRotations = options.maxRotations ?? minRotations;
  assertFullRotations(minRotations);
  assertFullRotations(maxRotations);

  if (minRotations > maxRotations) {
    throw new Error(SPIN_ENGINE_ERRORS.invalidRotationRange);
  }

  if (minRotations === maxRotations) {
    return minRotations;
  }

  const sample = options.rotationRandom === undefined ? 0 : resolveRandomValue(options.rotationRandom);
  return minRotations + sample * (maxRotations - minRotations);
}

function resolveRandomValue(randomValue: RandomValue): number {
  const value = typeof randomValue === 'function' ? randomValue() : randomValue;

  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(WEIGHTED_SELECTION_ERRORS.invalidRandom);
  }

  return value;
}

function normalizePositive(angle: number): number {
  return ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

function assertFullRotations(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(SPIN_ENGINE_ERRORS.invalidFullRotations);
  }
}

function assertLanding(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(SPIN_ENGINE_ERRORS.invalidLanding);
  }
}

function assertCurrentRotation(value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(SPIN_ENGINE_ERRORS.invalidCurrentRotation);
  }
}
