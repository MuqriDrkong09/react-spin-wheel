import { GENERATOR_MESSAGES, NUMBER_MODE } from '@/features/random-generator/constants';
import type { GeneratorResult, NumberMode } from '@/features/random-generator/types';
import {
  RANDOM_ERRORS,
  randomDecimal,
  randomInt,
  type RandomValue,
} from '@/utils/random';

export interface GenerateRandomNumberInput {
  min: number;
  max: number;
  mode: NumberMode;
  decimals: number;
}

export function generateRandomNumber(
  input: GenerateRandomNumberInput,
  randomValue: RandomValue,
): GeneratorResult<number> {
  if (input.min > input.max) {
    return { ok: false, error: GENERATOR_MESSAGES.minGreaterThanMax };
  }

  try {
    const value =
      input.mode === NUMBER_MODE.integer
        ? randomInt(input.min, input.max, randomValue)
        : randomDecimal(input.min, input.max, input.decimals, randomValue);

    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: numberErrorMessage(error) };
  }
}

export function formatRandomNumber(value: number, mode: NumberMode, decimals: number): string {
  if (mode === NUMBER_MODE.integer) {
    return String(value);
  }

  return value.toFixed(decimals);
}

function numberErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : GENERATOR_MESSAGES.minGreaterThanMax;

  if (message === RANDOM_ERRORS.invalidRange) {
    return GENERATOR_MESSAGES.minGreaterThanMax;
  }

  if (message === RANDOM_ERRORS.invalidIntegerRange) {
    return GENERATOR_MESSAGES.invalidIntegerRange;
  }

  if (message === RANDOM_ERRORS.invalidDecimals) {
    return GENERATOR_MESSAGES.decimalsRequired;
  }

  return message;
}
