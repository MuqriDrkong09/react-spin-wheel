import {
  DEFAULT_TOURNAMENT_PARTICIPANTS,
  GENERATOR_LIMITS,
  GENERATOR_MESSAGES,
  MATCH_STATUS,
  TOURNAMENT_ROUND,
  TOURNAMENT_STATUS,
} from '@/features/random-generator/constants';
import type { TournamentBracket, TournamentMatch } from '@/features/random-generator/types';
import {
  advanceWinner,
  cloneBracket,
  generateTournament,
  nextPowerOfTwo,
  participantName,
  resolveTournamentRound,
  selectEliminatedParticipants,
  settleAutomaticByes,
} from '@/features/random-generator/utils/generateTournament';
import * as random from '@/utils/random';

const ids = {
  createBracketId: () => 't1',
  createParticipantId: (index: number) => `p${index}`,
  now: () => '2026-01-01T00:00:00.000Z',
};

function bracketOf(participants: string[], random = false): TournamentBracket {
  const result = generateTournament({ participants, random }, random ? 0 : 0, ids);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}

function namesForMatch(
  result: ReturnType<typeof generateTournament>,
  matchId: string,
): [string, string] {
  if (!result.ok) {
    throw new Error(result.error);
  }

  const match = result.value.rounds.flatMap((round) => round.matches).find((item) => item.id === matchId);
  if (!match) {
    throw new Error(`Missing match ${matchId}`);
  }

  return [
    participantName(result.value, match.slots[0].participantId),
    participantName(result.value, match.slots[1].participantId, GENERATOR_MESSAGES.byeLabel),
  ];
}

describe('nextPowerOfTwo', () => {
  it('returns the next power of two for tournament sizing', () => {
    expect(nextPowerOfTwo(1)).toBe(1);
    expect(nextPowerOfTwo(2)).toBe(2);
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(9)).toBe(16);
  });
});

describe('resolveTournamentRound', () => {
  it('names quarter finals, semi finals, and the final from player counts', () => {
    expect(resolveTournamentRound(8)).toEqual({
      kind: TOURNAMENT_ROUND.quarterFinals,
      label: GENERATOR_MESSAGES.quarterFinalsLabel,
    });
    expect(resolveTournamentRound(4)).toEqual({
      kind: TOURNAMENT_ROUND.semiFinals,
      label: GENERATOR_MESSAGES.semiFinalsLabel,
    });
    expect(resolveTournamentRound(2)).toEqual({
      kind: TOURNAMENT_ROUND.final,
      label: GENERATOR_MESSAGES.finalLabel,
    });
    expect(resolveTournamentRound(1)).toEqual({
      kind: TOURNAMENT_ROUND.final,
      label: GENERATOR_MESSAGES.finalLabel,
    });
    expect(resolveTournamentRound(16).label).toBe('Round of 16');
  });
});

describe('generateTournament', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds quarter finals through the final for eight participants', () => {
    const spy = vi.spyOn(Math, 'random');
    const result = generateTournament(
      { participants: [...DEFAULT_TOURNAMENT_PARTICIPANTS], random: false },
      0,
      ids,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.rounds.map((round) => round.label)).toEqual([
      GENERATOR_MESSAGES.quarterFinalsLabel,
      GENERATOR_MESSAGES.semiFinalsLabel,
      GENERATOR_MESSAGES.finalLabel,
    ]);
    expect(result.value.rounds.map((round) => round.matches.length)).toEqual([4, 2, 1]);
    expect(namesForMatch(result, '0-0')).toEqual(['A', 'B']);
    expect(namesForMatch(result, '0-1')).toEqual(['C', 'D']);
    expect(namesForMatch(result, '0-2')).toEqual(['E', 'F']);
    expect(namesForMatch(result, '0-3')).toEqual(['G', 'H']);
    expect(result.value.rounds[0]?.matches.every((match) => match.status === MATCH_STATUS.ready)).toBe(
      true,
    );
    expect(result.value.winnerId).toBeNull();
    expect(result.value.eliminatedIds).toEqual([]);
    expect(result.value.status).toBe(TOURNAMENT_STATUS.ready);
    expect(spy).not.toHaveBeenCalled();
  });

  it('shuffles pairing when random assignment is on', () => {
    const result = generateTournament(
      { participants: [...DEFAULT_TOURNAMENT_PARTICIPANTS], random: true },
      0,
      ids,
    );

    expect(namesForMatch(result, '0-0')).toEqual(['B', 'C']);
    expect(namesForMatch(result, '0-1')).toEqual(['D', 'E']);
    expect(namesForMatch(result, '0-2')).toEqual(['F', 'G']);
    expect(namesForMatch(result, '0-3')).toEqual(['H', 'A']);
  });

  it('gives a bye for an odd first-round count and auto-advances that player', () => {
    const result = generateTournament(
      { participants: ['A', 'B', 'C', 'D', 'E'], random: false },
      0,
      ids,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(namesForMatch(result, '0-0')).toEqual(['A', 'B']);
    expect(namesForMatch(result, '0-1')).toEqual(['C', 'D']);
    expect(namesForMatch(result, '0-2')).toEqual(['E', GENERATOR_MESSAGES.byeLabel]);
    expect(result.value.rounds[0]?.matches[2]).toMatchObject({
      status: MATCH_STATUS.bye,
      winnerId: 'p4',
    });
    expect(result.value.rounds[1]?.matches[1]).toMatchObject({
      status: MATCH_STATUS.bye,
      winnerId: 'p4',
    });
    expect(result.value.rounds[2]?.matches[0]?.slots[1]?.participantId).toBe('p4');
    expect(result.value.winnerId).toBeNull();
  });

  it('places each participant in exactly one opening match', () => {
    const result = generateTournament(
      { participants: [...DEFAULT_TOURNAMENT_PARTICIPANTS], random: true },
      () => 0.3,
      ids,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const openingIds = result.value.rounds[0]?.matches.flatMap((match) =>
      match.slots.map((slot) => slot.participantId).filter((id): id is string => id !== null),
    );

    expect(openingIds).toHaveLength(8);
    expect(new Set(openingIds).size).toBe(8);
  });

  it('parses string participants and uses default id helpers', () => {
    const result = generateTournament({ participants: 'A\n\nB\n  C  \n', random: false }, 0);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.participants.map((participant) => participant.name)).toEqual(['A', 'B', 'C']);
    expect(result.value.id.length).toBeGreaterThan(0);
    expect(result.value.createdAt.length).toBeGreaterThan(0);
    expect(result.value.participants.every((participant) => participant.id.length > 0)).toBe(true);
  });

  it('rejects invalid participant lists', () => {
    expect(generateTournament({ participants: ['A'], random: false }, 0, ids)).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.tournamentRequired,
    });

    const tooMany = Array.from(
      { length: GENERATOR_LIMITS.maxParticipants + 1 },
      (_, index) => `Person ${index}`,
    );
    expect(generateTournament({ participants: tooMany, random: false }, 0, ids)).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.tooManyParticipants,
    });

    expect(
      generateTournament(
        {
          participants: ['Ahmad', 'x'.repeat(GENERATOR_LIMITS.maxParticipantName + 1)],
          random: false,
        },
        0,
        ids,
      ),
    ).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.participantNameTooLong,
    });
  });

  it('skips missing left slots when pairing a sparse shuffled list', () => {
    vi.spyOn(random, 'shuffle').mockImplementation((items) => {
      const copy = [...items];
      delete copy[0];
      return copy;
    });

    const result = generateTournament(
      { participants: ['A', 'B', 'C', 'D'], random: true },
      0,
      ids,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const openingIds = result.value.rounds[0]?.matches.flatMap((match) =>
      match.slots.map((slot) => slot.participantId).filter((id): id is string => id !== null),
    );
    expect(openingIds).toEqual(['p2', 'p3']);
    expect(result.value.participants.filter(Boolean)).toHaveLength(3);
  });
});

describe('participantName and selectEliminatedParticipants', () => {
  it('resolves names, empty slots, and unknown ids', () => {
    const bracket = bracketOf(['A', 'B']);

    expect(participantName(bracket, 'p0')).toBe('A');
    expect(participantName(bracket, null)).toBe(GENERATOR_MESSAGES.tbdLabel);
    expect(participantName(bracket, null, 'Open')).toBe('Open');
    expect(participantName(bracket, 'missing')).toBe(GENERATOR_MESSAGES.tbdLabel);
  });

  it('returns eliminated participants from the bracket', () => {
    const bracket = {
      ...bracketOf(['A', 'B', 'C', 'D']),
      eliminatedIds: ['p1', 'p3'],
    };

    expect(selectEliminatedParticipants(bracket).map((participant) => participant.name)).toEqual([
      'B',
      'D',
    ]);
  });
});

describe('cloneBracket, settleAutomaticByes, and advanceWinner', () => {
  it('clones nested bracket data without sharing references', () => {
    const bracket = bracketOf(['A', 'B', 'C', 'D']);
    const cloned = cloneBracket(bracket);

    expect(cloned).toEqual(bracket);
    expect(cloned.participants).not.toBe(bracket.participants);
    expect(cloned.rounds).not.toBe(bracket.rounds);
    expect(cloned.rounds[0]?.matches[0]).not.toBe(bracket.rounds[0]?.matches[0]);
    expect(cloned.rounds[0]?.matches[0]?.slots[0]).not.toBe(bracket.rounds[0]?.matches[0]?.slots[0]);
  });

  it('skips bye matches that have already advanced', () => {
    const bracket = bracketOf(['A', 'B', 'C', 'D', 'E']);
    const settledAgain = settleAutomaticByes(bracket);

    expect(settledAgain.rounds[1]?.matches[1]?.winnerId).toBe('p4');
    expect(settledAgain.rounds[2]?.matches[0]?.slots[1]?.participantId).toBe('p4');
  });

  it('marks a two-player tournament complete when the final advances', () => {
    const bracket = bracketOf(['A', 'B']);
    const finalMatch = bracket.rounds[0]?.matches[0];
    expect(finalMatch).toBeDefined();
    if (!finalMatch) {
      return;
    }

    const completed = advanceWinner(bracket, finalMatch, 'p0');
    expect(completed).toMatchObject({
      winnerId: 'p0',
      status: TOURNAMENT_STATUS.complete,
    });
  });

  it('marks the next match ready once both feeder winners advance', () => {
    const bracket = bracketOf(['A', 'B', 'C', 'D']);
    const first = bracket.rounds[0]?.matches[0];
    const second = bracket.rounds[0]?.matches[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) {
      return;
    }

    const afterFirst = advanceWinner(bracket, first, 'p0');
    expect(afterFirst.rounds[1]?.matches[0]?.status).toBe(MATCH_STATUS.pending);

    const afterSecond = advanceWinner(afterFirst, second, 'p2');
    expect(afterSecond.rounds[1]?.matches[0]).toMatchObject({
      status: MATCH_STATUS.ready,
      winnerId: null,
      slots: [{ participantId: 'p0' }, { participantId: 'p2' }],
    });
  });

  it('completes when the next-round match slot is missing', () => {
    const bracket = bracketOf(['A', 'B', 'C', 'D']);
    const match = bracket.rounds[0]?.matches[0];
    expect(match).toBeDefined();
    if (!match) {
      return;
    }

    const broken: TournamentBracket = {
      ...bracket,
      rounds: bracket.rounds.map((round, index) =>
        index === 1 ? { ...round, matches: [] } : round,
      ),
    };

    expect(advanceWinner(broken, match, 'p0')).toMatchObject({
      winnerId: 'p0',
      status: TOURNAMENT_STATUS.complete,
    });
  });

  it('keeps complete status when advancing with an existing champion', () => {
    const bracket = {
      ...bracketOf(['A', 'B', 'C', 'D']),
      winnerId: 'p0',
      status: TOURNAMENT_STATUS.complete,
    };
    const match = bracket.rounds[0]?.matches[1];
    expect(match).toBeDefined();
    if (!match) {
      return;
    }

    const next = advanceWinner(bracket, match, 'p2');
    expect(next.status).toBe(TOURNAMENT_STATUS.complete);
    expect(next.rounds[1]?.matches[0]?.slots[1]?.participantId).toBe('p2');
  });

  it('settles a final-round bye into a champion', () => {
    const byeFinal: TournamentMatch = {
      id: '0-0',
      roundIndex: 0,
      matchIndex: 0,
      slots: [{ participantId: 'p0' }, { participantId: null }],
      winnerId: 'p0',
      status: MATCH_STATUS.bye,
    };
    const bracket: TournamentBracket = {
      id: 'solo',
      createdAt: '2026-01-01T00:00:00.000Z',
      status: TOURNAMENT_STATUS.ready,
      participants: [{ id: 'p0', name: 'A' }],
      rounds: [
        {
          index: 0,
          kind: TOURNAMENT_ROUND.final,
          label: GENERATOR_MESSAGES.finalLabel,
          matches: [byeFinal],
        },
      ],
      winnerId: null,
      eliminatedIds: [],
    };

    const settled = settleAutomaticByes(bracket);
    expect(settled.winnerId).toBe('p0');
    expect(settled.status).toBe(TOURNAMENT_STATUS.complete);
  });

  it('treats a missing previous round as zero feeder matches', () => {
    const bracket = bracketOf(['A', 'B', 'C', 'D']);
    const syntheticMatch: TournamentMatch = {
      id: 'synth',
      roundIndex: -1,
      matchIndex: 0,
      slots: [{ participantId: 'p0' }, { participantId: 'p1' }],
      winnerId: 'p0',
      status: MATCH_STATUS.complete,
    };

    const next = advanceWinner(bracket, syntheticMatch, 'p0');
    expect(next.rounds[0]?.matches[0]?.slots[0]?.participantId).toBe('p0');
    expect(next.rounds[0]?.matches[0]?.status).toBe(MATCH_STATUS.ready);
  });

  it('advances into a next match even when slot entries are missing', () => {
    const bracket = bracketOf(['A', 'B', 'C', 'D']);
    const match = bracket.rounds[0]?.matches[0];
    expect(match).toBeDefined();
    if (!match) {
      return;
    }

    const sparseSlots = [] as unknown as TournamentMatch['slots'];
    const broken: TournamentBracket = {
      ...bracket,
      rounds: bracket.rounds.map((round, index) =>
        index === 1
          ? {
              ...round,
              matches: round.matches.map((candidate, matchIndex) =>
                matchIndex === 0
                  ? {
                      ...candidate,
                      slots: sparseSlots,
                    }
                  : candidate,
              ),
            }
          : round,
      ),
    };

    const next = advanceWinner(broken, match, 'p0');
    expect(next.rounds[1]?.matches[0]?.slots[0]?.participantId).toBe('p0');
    expect(next.status).toBe(TOURNAMENT_STATUS.inProgress);
  });

  it('ignores bye matches that have no winner yet', () => {
    const bracket: TournamentBracket = {
      id: 'pending-bye',
      createdAt: '2026-01-01T00:00:00.000Z',
      status: TOURNAMENT_STATUS.ready,
      participants: [{ id: 'p0', name: 'A' }],
      rounds: [
        {
          index: 0,
          kind: TOURNAMENT_ROUND.final,
          label: GENERATOR_MESSAGES.finalLabel,
          matches: [
            {
              id: '0-0',
              roundIndex: 0,
              matchIndex: 0,
              slots: [{ participantId: 'p0' }, { participantId: null }],
              winnerId: null,
              status: MATCH_STATUS.bye,
            },
          ],
        },
      ],
      winnerId: null,
      eliminatedIds: [],
    };

    const settled = settleAutomaticByes(bracket);
    expect(settled.winnerId).toBeNull();
    expect(settled.status).toBe(TOURNAMENT_STATUS.ready);
  });
});
