import { GENERATOR_MESSAGES, MATCH_STATUS, TOURNAMENT_STATUS } from '@/features/random-generator/constants';
import { generateTournament } from '@/features/random-generator/utils/generateTournament';
import { selectTournamentWinner } from '@/features/random-generator/utils/selectTournamentWinner';

const ids = {
  createBracketId: () => 't1',
  createParticipantId: (index: number) => `p${index}`,
  now: () => '2026-01-01T00:00:00.000Z',
};

function bracketOf(participants: string[]) {
  const result = generateTournament({ participants, random: false }, 0, ids);
  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.value;
}

describe('selectTournamentWinner', () => {
  it('advances the winner, eliminates the loser, and completes the tournament', () => {
    let bracket = bracketOf(['A', 'B', 'C', 'D']);

    const quarter = selectTournamentWinner(bracket, '0-0', 'p0');
    expect(quarter.ok).toBe(true);
    if (!quarter.ok) {
      return;
    }

    expect(quarter.value.eliminatedIds).toEqual(['p1']);
    expect(quarter.value.rounds[0]?.matches[0]).toMatchObject({
      status: MATCH_STATUS.complete,
      winnerId: 'p0',
    });
    expect(quarter.value.rounds[1]?.matches[0]?.slots[0]?.participantId).toBe('p0');
    expect(quarter.value.status).toBe(TOURNAMENT_STATUS.inProgress);

    const other = selectTournamentWinner(quarter.value, '0-1', 'p2');
    expect(other.ok).toBe(true);
    if (!other.ok) {
      return;
    }

    expect(other.value.rounds[1]?.matches[0]).toMatchObject({
      status: MATCH_STATUS.ready,
    });
    expect(other.value.eliminatedIds).toEqual(['p1', 'p3']);

    const champion = selectTournamentWinner(other.value, '1-0', 'p0');
    expect(champion).toMatchObject({
      ok: true,
      value: {
        winnerId: 'p0',
        status: TOURNAMENT_STATUS.complete,
        eliminatedIds: ['p1', 'p3', 'p2'],
      },
    });
  });

  it('rejects picks that are not ready or already complete', () => {
    const bracket = bracketOf(['A', 'B', 'C', 'D']);

    expect(selectTournamentWinner(bracket, '1-0', 'p0')).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.matchNotReady,
    });

    const first = selectTournamentWinner(bracket, '0-0', 'p0');
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }

    expect(selectTournamentWinner(first.value, '0-0', 'p1')).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.matchAlreadyComplete,
    });
    expect(selectTournamentWinner(first.value, '0-1', 'p0')).toEqual({
      ok: false,
      error: GENERATOR_MESSAGES.invalidWinner,
    });
  });
});
