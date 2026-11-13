import {
  CHOICE_PRESET,
  GENERATOR_LIMITS,
  GENERATOR_MESSAGES,
  NAME_STYLE,
  NUMBER_MODE,
} from '@/features/random-generator/constants';
import {
  defaultRandomChoiceValues,
  defaultRandomItemValues,
  defaultRandomNameValues,
  defaultRandomNumberValues,
  defaultTeamGeneratorValues,
  defaultTournamentValues,
  randomChoiceFormSchema,
  randomItemFormSchema,
  randomNameFormSchema,
  randomNumberFormSchema,
  teamGeneratorFormSchema,
  tournamentFormSchema,
} from '@/features/random-generator/schema';

describe('random generator schemas', () => {
  describe('defaults', () => {
    it('exposes safe default form values', () => {
      expect(defaultRandomNumberValues).toEqual({
        min: 1,
        max: 100,
        mode: NUMBER_MODE.integer,
        decimals: GENERATOR_LIMITS.defaultDecimals,
      });
      expect(defaultRandomItemValues.items).toHaveLength(2);
      expect(defaultRandomNameValues).toEqual({ style: NAME_STYLE.full, count: 1 });
      expect(defaultRandomChoiceValues.preset).toBe(CHOICE_PRESET.yesNo);
      expect(teamGeneratorFormSchema.safeParse(defaultTeamGeneratorValues).success).toBe(true);
      expect(tournamentFormSchema.safeParse(defaultTournamentValues).success).toBe(true);
    });
  });

  describe('randomNumberFormSchema', () => {
    it('accepts a valid integer and decimal payload', () => {
      expect(
        randomNumberFormSchema.safeParse({
          min: 1,
          max: 10,
          mode: NUMBER_MODE.integer,
          decimals: 2,
        }).success,
      ).toBe(true);
      expect(
        randomNumberFormSchema.safeParse({
          min: '0.5',
          max: '1.5',
          mode: NUMBER_MODE.decimal,
          decimals: '3',
        }).success,
      ).toBe(true);
    });

    it('rejects inverted ranges and invalid decimals', () => {
      const inverted = randomNumberFormSchema.safeParse({
        min: 10,
        max: 1,
        mode: NUMBER_MODE.integer,
        decimals: 2,
      });
      expect(inverted.success).toBe(false);
      if (!inverted.success) {
        expect(inverted.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.minGreaterThanMax);
      }

      const decimals = randomNumberFormSchema.safeParse({
        min: 1,
        max: 10,
        mode: NUMBER_MODE.decimal,
        decimals: GENERATOR_LIMITS.maxDecimals + 1,
      });
      expect(decimals.success).toBe(false);
      if (!decimals.success) {
        expect(decimals.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.decimalsRequired);
      }
    });
  });

  describe('randomItemFormSchema', () => {
    it('accepts weighted items and coerces weight strings', () => {
      expect(
        randomItemFormSchema.safeParse({ items: [{ name: 'Pizza', weight: '2' }] }).success,
      ).toBe(true);
    });

    it('rejects empty lists, blank names, and invalid weights', () => {
      expect(randomItemFormSchema.safeParse({ items: [] }).success).toBe(false);

      const blankName = randomItemFormSchema.safeParse({ items: [{ name: '  ', weight: 1 }] });
      expect(blankName.success).toBe(false);
      if (!blankName.success) {
        expect(blankName.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.itemNameRequired);
      }

      const weight = randomItemFormSchema.safeParse({ items: [{ name: 'Pizza', weight: 0 }] });
      expect(weight.success).toBe(false);
      if (!weight.success) {
        expect(weight.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.invalidWeight);
      }
    });
  });

  describe('randomNameFormSchema', () => {
    it('accepts each name style within the count limits', () => {
      expect(randomNameFormSchema.safeParse({ style: NAME_STYLE.first, count: 1 }).success).toBe(
        true,
      );
      expect(randomNameFormSchema.safeParse({ style: NAME_STYLE.last, count: '5' }).success).toBe(
        true,
      );
      expect(
        randomNameFormSchema.safeParse({
          style: NAME_STYLE.full,
          count: GENERATOR_LIMITS.maxNameCount,
        }).success,
      ).toBe(true);
    });

    it('rejects out-of-range name counts', () => {
      const result = randomNameFormSchema.safeParse({
        style: NAME_STYLE.full,
        count: GENERATOR_LIMITS.maxNameCount + 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.nameCountRequired);
      }
    });
  });

  describe('randomChoiceFormSchema', () => {
    it('skips custom option checks for preset choices', () => {
      expect(
        randomChoiceFormSchema.safeParse({
          preset: CHOICE_PRESET.yesNo,
          options: [{ name: '' }, { name: '' }],
        }).success,
      ).toBe(true);
      expect(
        randomChoiceFormSchema.safeParse({
          preset: CHOICE_PRESET.headsTails,
          options: [],
        }).success,
      ).toBe(true);
    });

    it('requires at least two named options for custom lists', () => {
      expect(
        randomChoiceFormSchema.safeParse({
          preset: CHOICE_PRESET.custom,
          options: [{ name: 'Yes' }, { name: 'No' }],
        }).success,
      ).toBe(true);

      const incomplete = randomChoiceFormSchema.safeParse({
        preset: CHOICE_PRESET.custom,
        options: [{ name: 'Yes' }, { name: '  ' }],
      });
      expect(incomplete.success).toBe(false);
      if (!incomplete.success) {
        expect(incomplete.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.choicesRequired);
      }
    });
  });

  describe('teamGeneratorFormSchema', () => {
    it('accepts the default team payload', () => {
      expect(teamGeneratorFormSchema.safeParse(defaultTeamGeneratorValues).success).toBe(true);
    });

    it('rejects too many teams for the participant count', () => {
      const result = teamGeneratorFormSchema.safeParse({
        ...defaultTeamGeneratorValues,
        teamCount: 7,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.tooManyTeams);
      }
    });

    it('rejects too many participants', () => {
      const participants = Array.from(
        { length: GENERATOR_LIMITS.maxParticipants + 1 },
        (_, index) => `Person ${index}`,
      ).join('\n');
      const result = teamGeneratorFormSchema.safeParse({
        ...defaultTeamGeneratorValues,
        participants,
        teamCount: 2,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.tooManyParticipants);
      }
    });

    it('rejects participant names that are too long', () => {
      const longName = 'x'.repeat(GENERATOR_LIMITS.maxParticipantName + 1);
      const result = teamGeneratorFormSchema.safeParse({
        ...defaultTeamGeneratorValues,
        participants: `${longName}\nAli`,
        teamCount: 2,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.participantNameTooLong);
      }
    });

    it('rejects duplicate-only lists when preventDuplicates is enabled', () => {
      const result = teamGeneratorFormSchema.safeParse({
        ...defaultTeamGeneratorValues,
        participants: 'Ahmad\nahmad\nAHMAD',
        teamCount: 2,
        preventDuplicates: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.participantsRequired);
      }
    });

    it('allows duplicate names when preventDuplicates is disabled', () => {
      expect(
        teamGeneratorFormSchema.safeParse({
          ...defaultTeamGeneratorValues,
          participants: 'Ahmad\nahmad',
          teamCount: 2,
          preventDuplicates: false,
        }).success,
      ).toBe(true);
    });
  });

  describe('tournamentFormSchema', () => {
    it('accepts the default tournament payload', () => {
      expect(tournamentFormSchema.safeParse(defaultTournamentValues).success).toBe(true);
    });

    it('rejects fewer than two participants', () => {
      const result = tournamentFormSchema.safeParse({ participants: 'A' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.tournamentRequired);
      }
    });

    it('rejects too many tournament participants', () => {
      const participants = Array.from(
        { length: GENERATOR_LIMITS.maxParticipants + 1 },
        (_, index) => `Player ${index}`,
      ).join('\n');
      const result = tournamentFormSchema.safeParse({ participants });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.tooManyParticipants);
      }
    });

    it('rejects tournament participant names that are too long', () => {
      const longName = 'y'.repeat(GENERATOR_LIMITS.maxParticipantName + 1);
      const result = tournamentFormSchema.safeParse({ participants: `${longName}\nB` });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.participantNameTooLong);
      }
    });
  });
});
