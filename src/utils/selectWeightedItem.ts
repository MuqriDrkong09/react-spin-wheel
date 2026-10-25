import type { WheelItem } from '@/types/wheel';

export type WeightedCandidate = Pick<WheelItem, 'enabled' | 'weight'>;

export type RandomValue = number | (() => number);

export const WEIGHTED_SELECTION_ERRORS = {
  invalidWeight: 'Item weights must be finite and cannot be negative.',
  invalidRandom: 'Random value must be a finite number between 0 and 1.',
} as const;

export function selectWeightedItem<T extends WeightedCandidate>(
  items: readonly T[],
  randomValue: RandomValue,
): T | undefined {
  const candidates = enabledCandidates(items);
  if (candidates.length === 0) {
    return undefined;
  }

  const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) {
    return undefined;
  }

  const target = resolveRandomValue(randomValue) * totalWeight;
  let cumulative = 0;

  for (const item of candidates) {
    if (item.weight === 0) {
      continue;
    }

    cumulative += item.weight;
    if (target < cumulative) {
      return item;
    }
  }

  return lastPositiveWeightItem(candidates);
}

function enabledCandidates<T extends WeightedCandidate>(items: readonly T[]): T[] {
  const candidates: T[] = [];

  for (const item of items) {
    if (!item.enabled) {
      continue;
    }

    if (!Number.isFinite(item.weight) || item.weight < 0) {
      throw new Error(WEIGHTED_SELECTION_ERRORS.invalidWeight);
    }

    candidates.push(item);
  }

  return candidates;
}

function resolveRandomValue(randomValue: RandomValue): number {
  const value = typeof randomValue === 'function' ? randomValue() : randomValue;

  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(WEIGHTED_SELECTION_ERRORS.invalidRandom);
  }

  return value;
}

function lastPositiveWeightItem<T extends WeightedCandidate>(items: readonly T[]): T | undefined {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (item && item.weight > 0) {
      return item;
    }
  }

  return undefined;
}
