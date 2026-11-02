import { GENERATOR_LIMITS, GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import type { GenerateTeamsInput, GeneratorResult, Team } from '@/features/random-generator/types';
import { shuffle, type RandomValue } from '@/utils/random';

export function parseParticipants(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function uniqueParticipants(names: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const name of names) {
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(name);
  }

  return unique;
}

export function teamLabel(index: number): string {
  if (index >= 0 && index < 26) {
    return `Team ${String.fromCharCode(65 + index)}`;
  }

  return `Team ${index + 1}`;
}

export function generateTeams(
  input: GenerateTeamsInput,
  randomValue: RandomValue,
): GeneratorResult<Team[]> {
  const parsed = resolveParticipants(input.participants);

  if (parsed.length > GENERATOR_LIMITS.maxParticipants) {
    return { ok: false, error: GENERATOR_MESSAGES.tooManyParticipants };
  }

  if (parsed.some((name) => name.length > GENERATOR_LIMITS.maxParticipantName)) {
    return { ok: false, error: GENERATOR_MESSAGES.participantNameTooLong };
  }

  const people = input.preventDuplicates ? uniqueParticipants(parsed) : parsed;

  if (people.length < GENERATOR_LIMITS.minParticipants) {
    return { ok: false, error: GENERATOR_MESSAGES.participantsRequired };
  }

  if (
    !Number.isInteger(input.teamCount) ||
    input.teamCount < GENERATOR_LIMITS.minTeamCount ||
    input.teamCount > GENERATOR_LIMITS.maxTeamCount
  ) {
    return { ok: false, error: GENERATOR_MESSAGES.teamCountRequired };
  }

  if (input.teamCount > people.length) {
    return { ok: false, error: GENERATOR_MESSAGES.tooManyTeams };
  }

  const ordered = input.random ? shuffle(people, randomValue) : [...people];
  return { ok: true, value: dealTeams(ordered, input.teamCount, input.balanced) };
}

function resolveParticipants(participants: GenerateTeamsInput['participants']): string[] {
  if (typeof participants === 'string') {
    return parseParticipants(participants);
  }

  return participants.map((name) => name.trim()).filter((name) => name.length > 0);
}

function dealTeams(people: readonly string[], teamCount: number, balanced: boolean): Team[] {
  const teams: Team[] = Array.from({ length: teamCount }, (_, index) => ({
    name: teamLabel(index),
    members: [],
  }));

  if (balanced) {
    people.forEach((person, index) => {
      teams[index % teamCount]?.members.push(person);
    });
    return teams;
  }

  const chunkSize = Math.max(1, Math.ceil(people.length / teamCount));
  people.forEach((person, index) => {
    const teamIndex = Math.min(Math.floor(index / chunkSize), teamCount - 1);
    teams[teamIndex]?.members.push(person);
  });

  return teams;
}
