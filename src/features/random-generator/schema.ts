import { z } from 'zod';

import {
  CHOICE_PRESET,
  DEFAULT_TEAM_PARTICIPANTS,
  GENERATOR_LIMITS,
  GENERATOR_MESSAGES,
  NAME_STYLE,
  NUMBER_MODE,
} from '@/features/random-generator/constants';
import {
  parseParticipants,
  uniqueParticipants,
} from '@/features/random-generator/utils/generateTeams';

export const randomNumberFormSchema = z
  .object({
    min: z.coerce.number().finite({ error: GENERATOR_MESSAGES.minRequired }),
    max: z.coerce.number().finite({ error: GENERATOR_MESSAGES.maxRequired }),
    mode: z.enum([NUMBER_MODE.integer, NUMBER_MODE.decimal]),
    decimals: z.coerce
      .number()
      .int({ error: GENERATOR_MESSAGES.decimalsRequired })
      .min(GENERATOR_LIMITS.minDecimals, GENERATOR_MESSAGES.decimalsRequired)
      .max(GENERATOR_LIMITS.maxDecimals, GENERATOR_MESSAGES.decimalsRequired),
  })
  .superRefine((value, context) => {
    if (value.min > value.max) {
      context.addIssue({
        code: 'custom',
        path: ['min'],
        message: GENERATOR_MESSAGES.minGreaterThanMax,
      });
    }
  });

export const randomItemFormSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1, GENERATOR_MESSAGES.itemNameRequired).max(GENERATOR_LIMITS.maxItemName),
        weight: z.coerce.number().finite().min(1, GENERATOR_MESSAGES.invalidWeight),
      }),
    )
    .min(1, GENERATOR_MESSAGES.itemsRequired),
});

export const randomNameFormSchema = z.object({
  style: z.enum([NAME_STYLE.first, NAME_STYLE.last, NAME_STYLE.full]),
  count: z.coerce
    .number()
    .int({ error: GENERATOR_MESSAGES.nameCountRequired })
    .min(GENERATOR_LIMITS.minNameCount, GENERATOR_MESSAGES.nameCountRequired)
    .max(GENERATOR_LIMITS.maxNameCount, GENERATOR_MESSAGES.nameCountRequired),
});

export const randomChoiceFormSchema = z
  .object({
    preset: z.enum([
      CHOICE_PRESET.yesNo,
      CHOICE_PRESET.headsTails,
      CHOICE_PRESET.trueFalse,
      CHOICE_PRESET.custom,
    ]),
    options: z.array(
      z.object({
        name: z.string(),
      }),
    ),
  })
  .superRefine((value, context) => {
    if (value.preset !== CHOICE_PRESET.custom) {
      return;
    }

    const names = value.options.map((option) => option.name.trim()).filter(Boolean);
    if (names.length < GENERATOR_LIMITS.minChoiceOptions) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: GENERATOR_MESSAGES.choicesRequired,
      });
    }
  });

export const teamGeneratorFormSchema = z
  .object({
    participants: z.string().trim().min(1, GENERATOR_MESSAGES.participantsRequired),
    teamCount: z.coerce
      .number()
      .int({ error: GENERATOR_MESSAGES.teamCountRequired })
      .min(GENERATOR_LIMITS.minTeamCount, GENERATOR_MESSAGES.teamCountRequired)
      .max(GENERATOR_LIMITS.maxTeamCount, GENERATOR_MESSAGES.teamCountRequired),
    balanced: z.boolean(),
    random: z.boolean(),
    preventDuplicates: z.boolean(),
  })
  .superRefine((value, context) => {
    const parsed = parseParticipants(value.participants);

    if (parsed.length > GENERATOR_LIMITS.maxParticipants) {
      context.addIssue({
        code: 'custom',
        path: ['participants'],
        message: GENERATOR_MESSAGES.tooManyParticipants,
      });
      return;
    }

    if (parsed.some((name) => name.length > GENERATOR_LIMITS.maxParticipantName)) {
      context.addIssue({
        code: 'custom',
        path: ['participants'],
        message: GENERATOR_MESSAGES.participantNameTooLong,
      });
      return;
    }

    const people = value.preventDuplicates ? uniqueParticipants(parsed) : parsed;

    if (people.length < GENERATOR_LIMITS.minParticipants) {
      context.addIssue({
        code: 'custom',
        path: ['participants'],
        message: GENERATOR_MESSAGES.participantsRequired,
      });
      return;
    }

    if (value.teamCount > people.length) {
      context.addIssue({
        code: 'custom',
        path: ['teamCount'],
        message: GENERATOR_MESSAGES.tooManyTeams,
      });
    }
  });

export type RandomNumberFormValues = z.infer<typeof randomNumberFormSchema>;
export type RandomItemFormValues = z.infer<typeof randomItemFormSchema>;
export type RandomNameFormValues = z.infer<typeof randomNameFormSchema>;
export type RandomChoiceFormValues = z.infer<typeof randomChoiceFormSchema>;
export type TeamGeneratorFormValues = z.infer<typeof teamGeneratorFormSchema>;

export const defaultRandomNumberValues: RandomNumberFormValues = {
  min: 1,
  max: 100,
  mode: NUMBER_MODE.integer,
  decimals: GENERATOR_LIMITS.defaultDecimals,
};

export const defaultRandomItemValues: RandomItemFormValues = {
  items: [
    { name: '', weight: 1 },
    { name: '', weight: 1 },
  ],
};

export const defaultRandomNameValues: RandomNameFormValues = {
  style: NAME_STYLE.full,
  count: 1,
};

export const defaultRandomChoiceValues: RandomChoiceFormValues = {
  preset: CHOICE_PRESET.yesNo,
  options: [{ name: '' }, { name: '' }],
};

export const defaultTeamGeneratorValues: TeamGeneratorFormValues = {
  participants: DEFAULT_TEAM_PARTICIPANTS.join('\n'),
  teamCount: 2,
  balanced: true,
  random: true,
  preventDuplicates: true,
};
