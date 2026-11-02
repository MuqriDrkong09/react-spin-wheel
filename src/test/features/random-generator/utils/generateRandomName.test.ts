import { NAME_STYLE } from '@/features/random-generator/constants';
import { FIRST_NAMES, LAST_NAMES } from '@/features/random-generator/data/names';
import { generateRandomName } from '@/features/random-generator/utils/generateRandomName';

describe('generateRandomName', () => {
  it('picks first, last, and full names from the shared lists', () => {
    expect(generateRandomName({ style: NAME_STYLE.first, count: 1 }, 0)).toEqual({
      ok: true,
      value: [FIRST_NAMES[0]],
    });
    expect(generateRandomName({ style: NAME_STYLE.last, count: 1 }, 1)).toEqual({
      ok: true,
      value: [LAST_NAMES[LAST_NAMES.length - 1]],
    });
    expect(generateRandomName({ style: NAME_STYLE.full, count: 1 }, 0)).toEqual({
      ok: true,
      value: [`${FIRST_NAMES[0]} ${LAST_NAMES[0]}`],
    });
  });

  it('uses an injected sequence for multiple names without Math.random', () => {
    const units = [0, 1, 0.5, 0.25];
    const randomValue = vi.fn(() => units.shift() ?? 0);
    const spy = vi.spyOn(Math, 'random');

    const result = generateRandomName({ style: NAME_STYLE.full, count: 2 }, randomValue);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0]).toBe(`${FIRST_NAMES[0]} ${LAST_NAMES[LAST_NAMES.length - 1]}`);
    }
    expect(randomValue).toHaveBeenCalledTimes(4);
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});
