import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import { generateTournament } from '@/features/random-generator/utils/generateTournament';
import {
  formatTournamentHistoryLabel,
  formatTournamentRoundFlow,
  formatTournamentSettings,
} from '@/features/random-generator/utils/formatTournamentHistory';
import { selectTournamentWinner } from '@/features/random-generator/utils/selectTournamentWinner';

const ids = {
  createBracketId: () => 't1',
  createParticipantId: (index: number) => `p${index}`,
  now: () => '2026-01-01T00:00:00.000Z',
};

describe('formatTournamentHistory', () => {
  it('formats the round flow and winner summary', () => {
    const created = generateTournament(
      { participants: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], random: false },
      0,
      ids,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    expect(formatTournamentRoundFlow(created.value)).toBe(
      'Quarter Finals → Semi Finals → Final → Winner',
    );
    expect(formatTournamentHistoryLabel(created.value)).toBe(
      'Quarter Finals → Semi Finals → Final → Winner',
    );
    expect(formatTournamentSettings(created.value)).toBe(`8 players · ${GENERATOR_MESSAGES.noWinner}`);

    let bracket = created.value;
    for (const [matchId, winnerId] of [
      ['0-0', 'p0'],
      ['0-1', 'p2'],
      ['0-2', 'p4'],
      ['0-3', 'p6'],
      ['1-0', 'p0'],
      ['1-1', 'p4'],
      ['2-0', 'p0'],
    ] as const) {
      const next = selectTournamentWinner(bracket, matchId, winnerId);
      expect(next.ok).toBe(true);
      if (!next.ok) {
        return;
      }
      bracket = next.value;
    }

    expect(formatTournamentSettings(bracket)).toBe('8 players · Winner: A');
  });
});
