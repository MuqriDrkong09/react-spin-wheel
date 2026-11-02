import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import type { Team, TeamGeneratorHistoryEntry } from '@/features/random-generator/types';

export function formatTeamMembers(members: readonly string[]): string {
  return members.length > 0 ? members.join(', ') : GENERATOR_MESSAGES.noTeamMembers;
}

export function formatTeamLine(team: Team): string {
  return `${team.name} — ${formatTeamMembers(team.members)}`;
}

export function formatTeamAssignment(teams: readonly Team[]): string {
  return teams.map(formatTeamLine).join(' · ');
}

export function formatTeamSettings(entry: Pick<
  TeamGeneratorHistoryEntry,
  'teamCount' | 'balanced' | 'random' | 'preventDuplicates'
>): string {
  const parts = [`${entry.teamCount} teams`];

  if (entry.balanced) {
    parts.push('Balanced');
  }

  if (entry.random) {
    parts.push('Random');
  }

  if (entry.preventDuplicates) {
    parts.push('No duplicates');
  }

  return parts.join(' · ');
}

export function formatTeamHistoryLabel(entry: TeamGeneratorHistoryEntry): string {
  return entry.teams.map((team) => team.name).join(', ');
}
