import { CHOICE_PRESET, CHOICE_PRESETS, GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import type { ChoicePreset, GeneratorResult } from '@/features/random-generator/types';
import { pickItem, type RandomValue } from '@/utils/random';

export function resolveChoiceOptions(
  preset: ChoicePreset,
  customOptions: readonly { name: string }[],
): string[] {
  if (preset !== CHOICE_PRESET.custom) {
    return [...CHOICE_PRESETS[preset].options];
  }

  return customOptions.map((option) => option.name.trim()).filter(Boolean);
}

export function generateRandomChoice(
  options: readonly string[],
  randomValue: RandomValue,
): GeneratorResult<string> {
  const choices = options.map((option) => option.trim()).filter(Boolean);
  if (choices.length < 2) {
    return { ok: false, error: GENERATOR_MESSAGES.choicesRequired };
  }

  const selected = pickItem(choices, randomValue);
  if (!selected) {
    return { ok: false, error: GENERATOR_MESSAGES.choicesRequired };
  }

  return { ok: true, value: selected };
}
