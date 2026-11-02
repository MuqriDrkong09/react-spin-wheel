import { GENERATOR_MESSAGES, MATCH_STATUS, TOURNAMENT_STATUS } from '@/features/random-generator/constants';
import type { GeneratorResult, TournamentBracket, TournamentMatch } from '@/features/random-generator/types';
import {
  advanceWinner,
  cloneBracket,
  settleAutomaticByes,
} from '@/features/random-generator/utils/generateTournament';

export function selectTournamentWinner(
  bracket: TournamentBracket,
  matchId: string,
  winnerId: string,
): GeneratorResult<TournamentBracket> {
  const current = cloneBracket(bracket);
  const match = findMatch(current, matchId);

  if (!match) {
    return { ok: false, error: GENERATOR_MESSAGES.matchNotReady };
  }

  if (match.status === MATCH_STATUS.pending) {
    return { ok: false, error: GENERATOR_MESSAGES.matchNotReady };
  }

  if (match.status === MATCH_STATUS.complete || match.status === MATCH_STATUS.bye) {
    return { ok: false, error: GENERATOR_MESSAGES.matchAlreadyComplete };
  }

  const slotIds = match.slots.map((slot) => slot.participantId);
  if (!slotIds.includes(winnerId)) {
    return { ok: false, error: GENERATOR_MESSAGES.invalidWinner };
  }

  const loserId = slotIds.find((participantId) => participantId && participantId !== winnerId) ?? null;
  match.winnerId = winnerId;
  match.status = MATCH_STATUS.complete;

  const eliminatedIds =
    loserId && !current.eliminatedIds.includes(loserId)
      ? [...current.eliminatedIds, loserId]
      : current.eliminatedIds;

  const withWinner: TournamentBracket = {
    ...current,
    eliminatedIds,
    status: TOURNAMENT_STATUS.inProgress,
  };

  return { ok: true, value: settleAutomaticByes(advanceWinner(withWinner, match, winnerId)) };
}

function findMatch(bracket: TournamentBracket, matchId: string): TournamentMatch | undefined {
  for (const round of bracket.rounds) {
    const match = round.matches.find((candidate) => candidate.id === matchId);
    if (match) {
      return match;
    }
  }

  return undefined;
}
