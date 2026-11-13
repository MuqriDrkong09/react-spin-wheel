import { CHOICE_PRESET, CHOICE_PRESETS, GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import {
  generateRandomChoice,
  resolveChoiceOptions,
} from '@/features/random-generator/utils/generateRandomChoice';
import * as random from '@/utils/random';

describe('resolveChoiceOptions', () => {
  it('returns preset options for built-in choice lists', () => {
    expect(resolveChoiceOptions(CHOICE_PRESET.yesNo, [])).toEqual([...CHOICE_PRESETS.yesNo.options]);
    expect(resolveChoiceOptions(CHOICE_PRESET.headsTails, [{ name: 'Ignored' }])).toEqual([
      ...CHOICE_PRESETS.headsTails.options,
    ]);
    expect(resolveChoiceOptions(CHOICE_PRESET.trueFalse, [])).toEqual([
      ...CHOICE_PRESETS.trueFalse.options,
    ]);
  });

  it('trims and drops blank custom options', () => {
    expect(
      resolveChoiceOptions(CHOICE_PRESET.custom, [
        { name: ' Stay in ' },
        { name: '' },
        { name: '   ' },
        { name: 'Go out' },
      ]),
    ).toEqual(['Stay in', 'Go out']);
  });
});

describe('generateRandomChoice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('picks uniformly from resolved options', () => {
    expect(generateRandomChoice(['Yes', 'No'], 0)).toEqual({ ok: true, value: 'Yes' });
    expect(generateRandomChoice(['Yes', 'No'], 0.5)).toEqual({ ok: true, value: 'No' });
    expect(generateRandomChoice(['Heads', 'Tails'], 1)).toEqual({ ok: true, value: 'Tails' });
  });

  it('trims blank entries before selecting', () => {
    expect(generateRandomChoice([' Stay in ', '', 'Go out'], 0)).toEqual({
      ok: true,
      value: 'Stay in',
    });
  });

  it('rejects lists with fewer than two usable choices', () => {
    expect(generateRandomChoice(['Only one'], 0.4)).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.choicesRequired,
    });
    expect(generateRandomChoice(['', '  '], 0.4)).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.choicesRequired,
    });
    expect(generateRandomChoice([], 0.4)).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.choicesRequired,
    });
  });

  it('surfaces choicesRequired when the picker returns nothing', () => {
    vi.spyOn(random, 'pickItem').mockReturnValue(undefined);

    expect(generateRandomChoice(['Yes', 'No'], 0)).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.choicesRequired,
    });
  });
});
