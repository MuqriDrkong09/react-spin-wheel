import { generateTournament } from '@/features/random-generator/utils/generateTournament';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { resetTournamentStore, useTournamentStore } from '@/stores/tournamentStore';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';

const ids = {
  createBracketId: () => 't1',
  createParticipantId: (index: number) => `p${index}`,
  now: () => '2026-01-01T00:00:00.000Z',
};

describe('tournamentStore', () => {
  beforeEach(() => {
    resetTournamentStore();
    resetWheelStore();
    resetHistoryStore();
  });

  it('tracks winners without touching wheel or spin state', () => {
    const created = generateTournament(
      { participants: ['A', 'B', 'C', 'D'], random: false },
      0,
      ids,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const wheelsBefore = useWheelStore.getState().wheels;
    useTournamentStore.getState().startTournament(created.value);
    useTournamentStore.getState().selectWinner('0-0', 'p0');

    expect(useTournamentStore.getState().activeTournament?.eliminatedIds).toEqual(['p1']);
    expect(useTournamentStore.getState().tournamentHistory).toHaveLength(1);
    expect(useTournamentStore.getState().tournamentHistory[0]?.eliminatedIds).toEqual(['p1']);
    expect(useWheelStore.getState().wheels).toEqual(wheelsBefore);
    expect(useHistoryStore.getState().spinHistory).toEqual([]);

    useTournamentStore.getState().deleteTournament('t1');
    expect(useTournamentStore.getState().activeTournament).toBeNull();
    expect(useTournamentStore.getState().tournamentHistory).toEqual([]);
  });
});
