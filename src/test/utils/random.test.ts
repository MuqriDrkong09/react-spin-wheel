import {
  pickIndex,
  pickItem,
  RANDOM_ERRORS,
  randomDecimal,
  randomFloat,
  randomInt,
  resolveUnitRandom,
} from '@/utils/random';

describe('resolveUnitRandom', () => {
  it('accepts unit values and injected functions', () => {
    expect(resolveUnitRandom(0)).toBe(0);
    expect(resolveUnitRandom(1)).toBe(1);
    expect(resolveUnitRandom(() => 0.25)).toBe(0.25);
  });

  it('rejects values outside 0 to 1 without calling Math.random', () => {
    const spy = vi.spyOn(Math, 'random');

    expect(() => resolveUnitRandom(-0.01)).toThrow(RANDOM_ERRORS.invalidUnit);
    expect(() => resolveUnitRandom(1.01)).toThrow(RANDOM_ERRORS.invalidUnit);
    expect(() => resolveUnitRandom(Number.NaN)).toThrow(RANDOM_ERRORS.invalidUnit);
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});

describe('randomInt and randomFloat', () => {
  it('maps unit values onto an inclusive integer range', () => {
    expect(randomInt(1, 4, 0)).toBe(1);
    expect(randomInt(1, 4, 0.24)).toBe(1);
    expect(randomInt(1, 4, 0.25)).toBe(2);
    expect(randomInt(1, 4, 0.99)).toBe(4);
    expect(randomInt(1, 4, 1)).toBe(4);
  });

  it('maps unit values onto a continuous range shared with the spin engine', () => {
    expect(randomFloat(4, 8, 0)).toBe(4);
    expect(randomFloat(4, 8, 0.5)).toBe(6);
    expect(randomFloat(4, 8, 1)).toBe(8);
  });

  it('rounds decimals and clamps back into range', () => {
    expect(randomDecimal(0, 1, 2, 0.456)).toBe(0.46);
    expect(randomDecimal(1, 2, 0, 0.4)).toBe(1);
  });

  it('rejects inverted and non-finite ranges', () => {
    expect(() => randomFloat(8, 4, 0.5)).toThrow(RANDOM_ERRORS.invalidRange);
    expect(() => randomInt(1.2, 1.3, 0.5)).toThrow(RANDOM_ERRORS.invalidIntegerRange);
    expect(() => randomFloat(Number.NaN, 4, 0.5)).toThrow(RANDOM_ERRORS.invalidBound);
    expect(() => randomDecimal(0, 1, 1.5, 0.2)).toThrow(RANDOM_ERRORS.invalidDecimals);
  });
});

describe('pickItem', () => {
  it('picks by index from a uniform list', () => {
    const items = ['Yes', 'No', 'Maybe'];

    expect(pickItem(items, 0)).toBe('Yes');
    expect(pickItem(items, 0.33)).toBe('Yes');
    expect(pickItem(items, 0.34)).toBe('No');
    expect(pickItem(items, 1)).toBe('Maybe');
    expect(pickIndex(3, 0.9)).toBe(2);
  });

  it('returns undefined for an empty list', () => {
    expect(pickItem([], 0.5)).toBeUndefined();
  });
});
