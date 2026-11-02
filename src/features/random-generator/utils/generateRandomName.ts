import { GENERATOR_LIMITS, GENERATOR_MESSAGES, NAME_STYLE } from '@/features/random-generator/constants';
import { FIRST_NAMES, LAST_NAMES } from '@/features/random-generator/data/names';
import type { GeneratorResult, NameStyle } from '@/features/random-generator/types';
import { pickItem, type RandomValue } from '@/utils/random';

export interface GenerateRandomNameInput {
  style: NameStyle;
  count: number;
}

export function generateRandomName(
  input: GenerateRandomNameInput,
  randomValue: RandomValue,
): GeneratorResult<string[]> {
  if (
    !Number.isInteger(input.count) ||
    input.count < GENERATOR_LIMITS.minNameCount ||
    input.count > GENERATOR_LIMITS.maxNameCount
  ) {
    return { ok: false, error: GENERATOR_MESSAGES.nameCountRequired };
  }

  const names = Array.from({ length: input.count }, () => formatName(input.style, randomValue));
  return { ok: true, value: names };
}

function formatName(style: NameStyle, randomValue: RandomValue): string {
  if (style === NAME_STYLE.first) {
    return pickRequired(FIRST_NAMES, randomValue);
  }

  if (style === NAME_STYLE.last) {
    return pickRequired(LAST_NAMES, randomValue);
  }

  return `${pickRequired(FIRST_NAMES, randomValue)} ${pickRequired(LAST_NAMES, randomValue)}`;
}

function pickRequired(list: readonly string[], randomValue: RandomValue): string {
  const value = pickItem(list, randomValue);
  if (!value) {
    throw new Error(GENERATOR_MESSAGES.nameCountRequired);
  }

  return value;
}
