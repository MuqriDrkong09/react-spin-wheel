export type RandomValue = number | (() => number);

export const RANDOM_ERRORS = {
  invalidUnit: 'Random value must be a finite number between 0 and 1.',
  invalidBound: 'Range bounds must be finite numbers.',
  invalidRange: 'Minimum cannot be greater than maximum.',
  invalidIntegerRange: 'Integer range has no values between minimum and maximum.',
  invalidDecimals: 'Decimal places must be an integer between 0 and 10.',
  emptyList: 'Add at least one item.',
} as const;

export function resolveUnitRandom(randomValue: RandomValue): number {
  const value = typeof randomValue === 'function' ? randomValue() : randomValue;

  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(RANDOM_ERRORS.invalidUnit);
  }

  return value;
}

export function randomFloat(min: number, max: number, randomValue: RandomValue): number {
  assertFiniteBounds(min, max);

  if (min > max) {
    throw new Error(RANDOM_ERRORS.invalidRange);
  }

  return min + resolveUnitRandom(randomValue) * (max - min);
}

export function randomInt(min: number, max: number, randomValue: RandomValue): number {
  assertFiniteBounds(min, max);

  const low = Math.ceil(min);
  const high = Math.floor(max);
  if (low > high) {
    throw new Error(RANDOM_ERRORS.invalidIntegerRange);
  }

  const span = high - low + 1;
  const offset = Math.min(span - 1, Math.floor(resolveUnitRandom(randomValue) * span));
  return low + offset;
}

export function randomDecimal(
  min: number,
  max: number,
  decimals: number,
  randomValue: RandomValue,
): number {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 10) {
    throw new Error(RANDOM_ERRORS.invalidDecimals);
  }

  const value = randomFloat(min, max, randomValue);
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Math.min(max, Math.max(min, rounded));
}

export function pickIndex(length: number, randomValue: RandomValue): number {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error(RANDOM_ERRORS.emptyList);
  }

  return randomInt(0, length - 1, randomValue);
}

export function pickItem<T>(items: readonly T[], randomValue: RandomValue): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  return items[pickIndex(items.length, randomValue)];
}

function assertFiniteBounds(min: number, max: number): void {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new Error(RANDOM_ERRORS.invalidBound);
  }
}
