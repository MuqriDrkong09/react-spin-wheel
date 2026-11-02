import type { WheelItem } from '@/types/wheel';
import { RANDOM_ERRORS, resolveUnitRandom, type RandomValue } from '@/utils/random';

export type { RandomValue } from '@/utils/random';

export type WeightedCandidate = Pick<WheelItem, 'enabled' | 'weight'>;

export const WEIGHTED_SELECTION_ERRORS = {
  invalidWeight: 'Item weights must be finite and cannot be negative.',
  invalidRandom: RANDOM_ERRORS.invalidUnit,
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

  const target = resolveUnitRandom(randomValue) * totalWeight;
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

function lastPositiveWeightItem<T extends WeightedCandidate>(items: readonly T[]): T | undefined {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (item && item.weight > 0) {
      return item;
    }
  }

  return undefined;
}
