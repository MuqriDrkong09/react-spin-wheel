import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import type { GeneratorResult, RandomListItem } from '@/features/random-generator/types';
import type { RandomValue } from '@/utils/random';
import { selectWeightedItem } from '@/utils/selectWeightedItem';

export function generateRandomItem(
  items: readonly RandomListItem[],
  randomValue: RandomValue,
): GeneratorResult<RandomListItem> {
  const candidates = items
    .map((item) => ({
      name: item.name.trim(),
      weight: item.weight,
      enabled: true,
    }))
    .filter((item) => item.name.length > 0);

  if (candidates.length === 0) {
    return { ok: false, error: GENERATOR_MESSAGES.itemsRequired };
  }

  for (const item of candidates) {
    if (!Number.isFinite(item.weight) || item.weight < 1) {
      return { ok: false, error: GENERATOR_MESSAGES.invalidWeight };
    }
  }

  const selected = selectWeightedItem(candidates, randomValue);
  if (!selected) {
    return { ok: false, error: GENERATOR_MESSAGES.itemsRequired };
  }

  return { ok: true, value: { name: selected.name, weight: selected.weight } };
}
