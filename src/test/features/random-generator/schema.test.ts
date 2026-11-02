import { GENERATOR_MESSAGES, NAME_STYLE, NUMBER_MODE } from '@/features/random-generator/constants';
import {
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
  it('accepts a valid number, item, name, and choice payload', () => {
    expect(
      randomNumberFormSchema.safeParse({ min: 1, max: 10, mode: NUMBER_MODE.integer, decimals: 2 }).success,
    ).toBe(true);
    expect(
      randomItemFormSchema.safeParse({ items: [{ name: 'Pizza', weight: '2' }] }).success,
    ).toBe(true);
    expect(randomNameFormSchema.safeParse({ style: NAME_STYLE.full, count: 3 }).success).toBe(true);
    expect(
      randomChoiceFormSchema.safeParse({
        preset: 'custom',
        options: [{ name: 'Yes' }, { name: 'No' }],
      }).success,
    ).toBe(true);
    expect(teamGeneratorFormSchema.safeParse(defaultTeamGeneratorValues).success).toBe(true);
    expect(tournamentFormSchema.safeParse(defaultTournamentValues).success).toBe(true);
  });

  it('rejects inverted number ranges and incomplete custom choices', () => {
    const numbers = randomNumberFormSchema.safeParse({
      min: 10,
      max: 1,
      mode: NUMBER_MODE.integer,
      decimals: 2,
    });
    expect(numbers.success).toBe(false);
    if (!numbers.success) {
      expect(numbers.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.minGreaterThanMax);
    }

    const choices = randomChoiceFormSchema.safeParse({
      preset: 'custom',
      options: [{ name: 'Yes' }, { name: '  ' }],
    });
    expect(choices.success).toBe(false);

    const teams = teamGeneratorFormSchema.safeParse({
      ...defaultTeamGeneratorValues,
      teamCount: 7,
    });
    expect(teams.success).toBe(false);
    if (!teams.success) {
      expect(teams.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.tooManyTeams);
    }

    const tournament = tournamentFormSchema.safeParse({ participants: 'A' });
    expect(tournament.success).toBe(false);
    if (!tournament.success) {
      expect(tournament.error.issues[0]?.message).toBe(GENERATOR_MESSAGES.tournamentRequired);
    }
  });
});
