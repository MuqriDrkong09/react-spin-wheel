import { GENERATOR_MESSAGES, NUMBER_MODE } from '@/features/random-generator/constants';
import {
  formatRandomNumber,
  generateRandomNumber,
} from '@/features/random-generator/utils/generateRandomNumber';
import * as random from '@/utils/random';
import { RANDOM_ERRORS } from '@/utils/random';

describe('generateRandomNumber', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates integers and decimals from an injected unit value', () => {
    const spy = vi.spyOn(Math, 'random');

    expect(generateRandomNumber({ min: 1, max: 10, mode: NUMBER_MODE.integer, decimals: 2 }, 0)).toEqual({
      ok: true,
      value: 1,
    });
    expect(generateRandomNumber({ min: 1, max: 10, mode: NUMBER_MODE.integer, decimals: 2 }, 1)).toEqual({
      ok: true,
      value: 10,
    });
    expect(
      generateRandomNumber({ min: 0, max: 1, mode: NUMBER_MODE.decimal, decimals: 2 }, 0.456),
    ).toEqual({
      ok: true,
      value: 0.46,
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('formats integers and decimals for display', () => {
    expect(formatRandomNumber(7, NUMBER_MODE.integer, 2)).toBe('7');
    expect(formatRandomNumber(0.46, NUMBER_MODE.decimal, 2)).toBe('0.46');
    expect(formatRandomNumber(1.5, NUMBER_MODE.decimal, 0)).toBe('2');
  });

  it('returns user-facing errors for invalid ranges and decimals', () => {
    expect(
      generateRandomNumber({ min: 10, max: 1, mode: NUMBER_MODE.integer, decimals: 2 }, 0.5),
    ).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.minGreaterThanMax,
    });
    expect(
      generateRandomNumber({ min: 1.2, max: 1.3, mode: NUMBER_MODE.integer, decimals: 2 }, 0.5),
    ).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.invalidIntegerRange,
    });
    expect(
      generateRandomNumber({ min: 0, max: 1, mode: NUMBER_MODE.decimal, decimals: 11 }, 0.5),
    ).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.decimalsRequired,
    });
  });

  it('maps thrown random helper errors to generator messages', () => {
    vi.spyOn(random, 'randomInt').mockImplementation(() => {
      throw new Error(RANDOM_ERRORS.invalidRange);
    });
    expect(
      generateRandomNumber({ min: 1, max: 10, mode: NUMBER_MODE.integer, decimals: 2 }, 0.5),
    ).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.minGreaterThanMax,
    });

    vi.mocked(random.randomInt).mockImplementation(() => {
      throw new Error(RANDOM_ERRORS.invalidBound);
    });
    expect(
      generateRandomNumber({ min: 1, max: 10, mode: NUMBER_MODE.integer, decimals: 2 }, 0.5),
    ).toEqual({
      ok: false,
      error: RANDOM_ERRORS.invalidBound,
    });

    vi.mocked(random.randomInt).mockImplementation(() => {
      throw 'not-an-error';
    });
    expect(
      generateRandomNumber({ min: 1, max: 10, mode: NUMBER_MODE.integer, decimals: 2 }, 0.5),
    ).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.minGreaterThanMax,
    });
  });
});
