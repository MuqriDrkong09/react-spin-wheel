import {
  DEFAULT_TOURNAMENT_PARTICIPANTS,
  GENERATOR_MESSAGES,
  MATCH_STATUS,
  TOURNAMENT_ROUND,
  TOURNAMENT_STATUS,
} from '@/features/random-generator/constants';
import {
  generateTournament,
  participantName,
  resolveTournamentRound,
} from '@/features/random-generator/utils/generateTournament';

const ids = {
  createBracketId: () => 't1',
  createParticipantId: (index: number) => `p${index}`,
  now: () => '2026-01-01T00:00:00.000Z',
};

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
    expect(resolveTournamentRound(16).label).toBe('Round of 16');
  });
});

describe('generateTournament', () => {
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
    spy.mockRestore();
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

  it('rejects too few participants', () => {
    expect(generateTournament({ participants: ['A'], random: false }, 0, ids)).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.tournamentRequired,
    });
  });
});
