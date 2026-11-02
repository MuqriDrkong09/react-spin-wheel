import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import { generateRandomItem } from '@/features/random-generator/utils/generateRandomItem';

const items = [
  { name: 'Pizza', weight: 1 },
  { name: 'Burger', weight: 2 },
  { name: 'Sushi', weight: 1 },
];

describe('generateRandomItem', () => {
  it('uses the shared weighted selector', () => {
    const spy = vi.spyOn(Math, 'random');

    expect(generateRandomItem(items, 0)).toEqual({ ok: true, value: { name: 'Pizza', weight: 1 } });
    expect(generateRandomItem(items, 0.25)).toEqual({ ok: true, value: { name: 'Burger', weight: 2 } });
    expect(generateRandomItem(items, 1)).toEqual({ ok: true, value: { name: 'Sushi', weight: 1 } });
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('ignores blank rows and rejects empty or invalid lists', () => {
    expect(generateRandomItem([{ name: '  ', weight: 1 }], 0.5)).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.itemsRequired,
    });
    expect(generateRandomItem([{ name: 'Pizza', weight: 0 }], 0.5)).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.invalidWeight,
    });
    expect(generateRandomItem([{ name: ' Pizza ', weight: 2 }, { name: '', weight: 1 }], 0)).toEqual({
      ok: true,
      value: { name: 'Pizza', weight: 2 },
    });
  });
});
