import { CHOICE_PRESET, GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import {
  generateRandomChoice,
  resolveChoiceOptions,
} from '@/features/random-generator/utils/generateRandomChoice';

describe('generateRandomChoice', () => {
  it('picks uniformly from resolved options', () => {
    expect(resolveChoiceOptions(CHOICE_PRESET.yesNo, [])).toEqual(['Yes', 'No']);
    expect(generateRandomChoice(['Yes', 'No'], 0)).toEqual({ ok: true, value: 'Yes' });
    expect(generateRandomChoice(['Yes', 'No'], 0.5)).toEqual({ ok: true, value: 'No' });
    expect(generateRandomChoice(['Heads', 'Tails'], 1)).toEqual({ ok: true, value: 'Tails' });
  });

  it('uses custom named options and rejects a short list', () => {
    expect(
      resolveChoiceOptions(CHOICE_PRESET.custom, [{ name: ' Stay in ' }, { name: '' }, { name: 'Go out' }]),
    ).toEqual(['Stay in', 'Go out']);
    expect(generateRandomChoice(['Stay in', 'Go out'], 0)).toEqual({ ok: true, value: 'Stay in' });
    expect(generateRandomChoice(['Only one'], 0.4)).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.choicesRequired,
    });
  });
});
