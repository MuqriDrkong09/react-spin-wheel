import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import type { TournamentBracket } from '@/features/random-generator/types';
import { participantName } from '@/features/random-generator/utils/generateTournament';

export function formatTournamentRoundFlow(bracket: TournamentBracket): string {
  return `${bracket.rounds.map((round) => round.label).join(' → ')} → ${GENERATOR_MESSAGES.winnerTitle}`;
}

export function formatTournamentSettings(bracket: TournamentBracket): string {
  const winner = bracket.winnerId
    ? `${GENERATOR_MESSAGES.winnerTitle}: ${participantName(bracket, bracket.winnerId)}`
    : GENERATOR_MESSAGES.noWinner;

  return `${bracket.participants.length} players · ${winner}`;
}

export function formatTournamentHistoryLabel(bracket: TournamentBracket): string {
  return formatTournamentRoundFlow(bracket);
}
