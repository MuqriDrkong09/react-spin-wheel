import {
  GENERATOR_LIMITS,
  GENERATOR_MESSAGES,
  MATCH_STATUS,
  TOURNAMENT_ROUND,
  TOURNAMENT_STATUS,
} from '@/features/random-generator/constants';
import type {
  GenerateTournamentInput,
  GenerateTournamentOptions,
  GeneratorResult,
  TournamentBracket,
  TournamentMatch,
  TournamentParticipant,
  TournamentRound,
  TournamentRoundKind,
  TournamentSlot,
} from '@/features/random-generator/types';
import { parseParticipants } from '@/features/random-generator/utils/generateTeams';
import { createId, nowIso } from '@/utils/id';
import { shuffle, type RandomValue } from '@/utils/random';

export function nextPowerOfTwo(value: number): number {
  let size = 1;
  while (size < value) {
    size *= 2;
  }
  return size;
}

export function resolveTournamentRound(playerCount: number): {
  kind: TournamentRoundKind;
  label: string;
} {
  if (playerCount <= 2) {
    return { kind: TOURNAMENT_ROUND.final, label: GENERATOR_MESSAGES.finalLabel };
  }

  if (playerCount <= 4) {
    return { kind: TOURNAMENT_ROUND.semiFinals, label: GENERATOR_MESSAGES.semiFinalsLabel };
  }

  if (playerCount <= 8) {
    return { kind: TOURNAMENT_ROUND.quarterFinals, label: GENERATOR_MESSAGES.quarterFinalsLabel };
  }

  return {
    kind: TOURNAMENT_ROUND.roundOf,
    label: GENERATOR_MESSAGES.roundOf(nextPowerOfTwo(playerCount)),
  };
}

export function generateTournament(
  input: GenerateTournamentInput,
  randomValue: RandomValue,
  options: GenerateTournamentOptions = {},
): GeneratorResult<TournamentBracket> {
  const parsed = resolveParticipants(input.participants);

  if (parsed.length > GENERATOR_LIMITS.maxParticipants) {
    return { ok: false, error: GENERATOR_MESSAGES.tooManyParticipants };
  }

  if (parsed.some((name) => name.length > GENERATOR_LIMITS.maxParticipantName)) {
    return { ok: false, error: GENERATOR_MESSAGES.participantNameTooLong };
  }

  if (parsed.length < GENERATOR_LIMITS.minTournamentParticipants) {
    return { ok: false, error: GENERATOR_MESSAGES.tournamentRequired };
  }

  const ordered = input.random ? shuffle(parsed, randomValue) : [...parsed];
  const createParticipantId = options.createParticipantId ?? ((_index, _name) => createId());
  const participants: TournamentParticipant[] = ordered.map((name, index) => ({
    id: createParticipantId(index, name),
    name,
  }));

  const firstRoundMatches = pairParticipants(participants, 0);
  const rounds = buildRounds(firstRoundMatches, participants.length);
  const bracket: TournamentBracket = {
    id: options.createBracketId?.() ?? createId(),
    createdAt: options.now?.() ?? nowIso(),
    status: TOURNAMENT_STATUS.ready,
    participants,
    rounds,
    winnerId: null,
    eliminatedIds: [],
  };

  return { ok: true, value: settleAutomaticByes(bracket) };
}

export function participantName(
  bracket: TournamentBracket,
  participantId: string | null,
  emptyLabel = GENERATOR_MESSAGES.tbdLabel,
): string {
  if (participantId === null) {
    return emptyLabel;
  }

  return bracket.participants.find((participant) => participant.id === participantId)?.name ?? emptyLabel;
}

export function selectEliminatedParticipants(bracket: TournamentBracket): TournamentParticipant[] {
  return bracket.participants.filter((participant) => bracket.eliminatedIds.includes(participant.id));
}

function resolveParticipants(participants: GenerateTournamentInput['participants']): string[] {
  if (typeof participants === 'string') {
    return parseParticipants(participants);
  }

  return participants.map((name) => name.trim()).filter((name) => name.length > 0);
}

function pairParticipants(players: readonly TournamentParticipant[], roundIndex: number): TournamentMatch[] {
  const matches: TournamentMatch[] = [];

  for (let index = 0; index < players.length; index += 2) {
    const left = players[index];
    const right = players[index + 1];
    if (!left) {
      continue;
    }

    const matchIndex = matches.length;
    if (right) {
      matches.push(
        createMatch(roundIndex, matchIndex, left.id, right.id, null, MATCH_STATUS.ready),
      );
      continue;
    }

    matches.push(createMatch(roundIndex, matchIndex, left.id, null, left.id, MATCH_STATUS.bye));
  }

  return matches;
}

function buildRounds(firstRoundMatches: TournamentMatch[], playerCount: number): TournamentRound[] {
  const first = resolveTournamentRound(playerCount);
  const rounds: TournamentRound[] = [
    {
      index: 0,
      kind: first.kind,
      label: first.label,
      matches: firstRoundMatches,
    },
  ];

  let previousMatchCount = firstRoundMatches.length;
  let roundIndex = 1;

  while (previousMatchCount > 1) {
    const matchCount = Math.ceil(previousMatchCount / 2);
    const enteringCount = previousMatchCount;
    const round = resolveTournamentRound(enteringCount);
    rounds.push({
      index: roundIndex,
      kind: round.kind,
      label: round.label,
      matches: createEmptyMatches(roundIndex, matchCount),
    });
    previousMatchCount = matchCount;
    roundIndex += 1;
  }

  return rounds;
}

function createEmptyMatches(roundIndex: number, matchCount: number): TournamentMatch[] {
  return Array.from({ length: matchCount }, (_, matchIndex) =>
    createMatch(roundIndex, matchIndex, null, null, null, MATCH_STATUS.pending),
  );
}

function createMatch(
  roundIndex: number,
  matchIndex: number,
  leftId: string | null,
  rightId: string | null,
  winnerId: string | null,
  status: TournamentMatch['status'],
): TournamentMatch {
  return {
    id: `${roundIndex}-${matchIndex}`,
    roundIndex,
    matchIndex,
    slots: [{ participantId: leftId }, { participantId: rightId }] as [TournamentSlot, TournamentSlot],
    winnerId,
    status,
  };
}

export function settleAutomaticByes(bracket: TournamentBracket): TournamentBracket {
  let current = cloneBracket(bracket);
  let changed = true;

  while (changed) {
    changed = false;
    const byeMatches = current.rounds.flatMap((round) =>
      round.matches.filter((match) => match.status === MATCH_STATUS.bye && match.winnerId),
    );

    for (const match of byeMatches) {
      if (!match.winnerId || isAlreadyAdvanced(current, match, match.winnerId)) {
        continue;
      }

      current = advanceWinner(current, match, match.winnerId);
      changed = true;
    }
  }

  return current;
}

export function cloneBracket(bracket: TournamentBracket): TournamentBracket {
  return {
    ...bracket,
    participants: bracket.participants.map((participant) => ({ ...participant })),
    eliminatedIds: [...bracket.eliminatedIds],
    rounds: bracket.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((match) => ({
        ...match,
        slots: [{ ...match.slots[0] }, { ...match.slots[1] }] as [TournamentSlot, TournamentSlot],
      })),
    })),
  };
}

export function advanceWinner(
  bracket: TournamentBracket,
  match: TournamentMatch,
  winnerId: string,
): TournamentBracket {
  const nextRound = bracket.rounds[match.roundIndex + 1];
  if (!nextRound) {
    return {
      ...bracket,
      winnerId,
      status: TOURNAMENT_STATUS.complete,
    };
  }

  const nextMatchIndex = Math.floor(match.matchIndex / 2);
  const slotIndex = match.matchIndex % 2 === 0 ? 0 : 1;
  const nextMatch = nextRound.matches[nextMatchIndex];
  if (!nextMatch) {
    return {
      ...bracket,
      winnerId,
      status: TOURNAMENT_STATUS.complete,
    };
  }

  const slots: [TournamentSlot, TournamentSlot] = [{ ...nextMatch.slots[0] }, { ...nextMatch.slots[1] }];
  const currentSlot = slots[slotIndex];
  if (currentSlot) {
    currentSlot.participantId = winnerId;
  }

  const refreshed = refreshMatch(slots, nextMatch, previousRoundMatchCount(bracket, nextRound.index));
  const nextRounds = bracket.rounds.map((round) => {
    if (round.index !== nextRound.index) {
      return round;
    }

    return {
      ...round,
      matches: round.matches.map((candidate) => (candidate.id === nextMatch.id ? refreshed : candidate)),
    };
  });

  return {
    ...bracket,
    rounds: nextRounds,
    status: bracket.winnerId ? TOURNAMENT_STATUS.complete : TOURNAMENT_STATUS.inProgress,
  };
}

function previousRoundMatchCount(bracket: TournamentBracket, roundIndex: number): number {
  return bracket.rounds[roundIndex - 1]?.matches.length ?? 0;
}

function refreshMatch(
  slots: [TournamentSlot, TournamentSlot],
  match: TournamentMatch,
  previousMatchCount: number,
): TournamentMatch {
  const leftId = slots[0].participantId;
  const rightId = slots[1].participantId;
  const feederRight = match.matchIndex * 2 + 1;
  const hasRightFeeder = feederRight < previousMatchCount;

  if (leftId && rightId) {
    return {
      ...match,
      slots,
      winnerId: null,
      status: MATCH_STATUS.ready,
    };
  }

  if (leftId && !rightId && !hasRightFeeder) {
    return {
      ...match,
      slots,
      winnerId: leftId,
      status: MATCH_STATUS.bye,
    };
  }

  return {
    ...match,
    slots,
    winnerId: null,
    status: MATCH_STATUS.pending,
  };
}

function isAlreadyAdvanced(bracket: TournamentBracket, match: TournamentMatch, winnerId: string): boolean {
  const nextRound = bracket.rounds[match.roundIndex + 1];
  if (!nextRound) {
    return bracket.winnerId === winnerId;
  }

  const nextMatch = nextRound.matches[Math.floor(match.matchIndex / 2)];
  const slotIndex = match.matchIndex % 2 === 0 ? 0 : 1;
  return nextMatch?.slots[slotIndex]?.participantId === winnerId;
}
