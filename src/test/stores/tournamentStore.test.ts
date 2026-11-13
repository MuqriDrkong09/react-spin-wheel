import { GENERATOR_LIMITS } from '@/features/random-generator/constants';
import { generateTournament } from '@/features/random-generator/utils/generateTournament';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { resetTournamentStore, useTournamentStore } from '@/stores/tournamentStore';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';

function createBracket(
  participants: string[],
  options: {
    bracketId?: string;
    now?: string;
  } = {},
) {
  return generateTournament(
    { participants, random: false },
    0,
    {
      createBracketId: () => options.bracketId ?? 't1',
      createParticipantId: (index) => `p${index}`,
      now: () => options.now ?? '2026-01-01T00:00:00.000Z',
    },
  );
}

describe('tournamentStore', () => {
  beforeEach(() => {
    resetTournamentStore();
    resetWheelStore();
    resetHistoryStore();
  });

  it('tracks winners without touching wheel or spin state', () => {
    const created = createBracket(['A', 'B', 'C', 'D']);
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

  it('ignores winner selection when there is no active tournament or the pick is invalid', () => {
    useTournamentStore.getState().selectWinner('0-0', 'p0');
    expect(useTournamentStore.getState().activeTournament).toBeNull();

    const created = createBracket(['A', 'B']);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    useTournamentStore.getState().startTournament(created.value);
    const before = useTournamentStore.getState().activeTournament;
    useTournamentStore.getState().selectWinner('missing-match', 'p0');
    expect(useTournamentStore.getState().activeTournament).toEqual(before);
  });

  it('updates only the matching history entry and keeps other brackets intact', () => {
    const first = createBracket(['A', 'B'], { bracketId: 't1' });
    const second = createBracket(['C', 'D'], { bracketId: 't2', now: '2026-01-02T00:00:00.000Z' });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }

    useTournamentStore.getState().startTournament(first.value);
    useTournamentStore.getState().startTournament(second.value);
    expect(useTournamentStore.getState().activeTournament?.id).toBe('t2');
    expect(useTournamentStore.getState().tournamentHistory.map((entry) => entry.id)).toEqual([
      't2',
      't1',
    ]);

    useTournamentStore.getState().selectWinner('0-0', 'p0');
    expect(useTournamentStore.getState().activeTournament?.id).toBe('t2');
    expect(useTournamentStore.getState().tournamentHistory[0]?.eliminatedIds).toEqual(['p1']);
    expect(useTournamentStore.getState().tournamentHistory[1]?.eliminatedIds).toEqual([]);

    useTournamentStore.getState().deleteTournament('t1');
    expect(useTournamentStore.getState().activeTournament?.id).toBe('t2');
    expect(useTournamentStore.getState().tournamentHistory.map((entry) => entry.id)).toEqual(['t2']);
  });

  it('clears tournament history and caps retained brackets', () => {
    const created = createBracket(['A', 'B']);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    for (let index = 0; index < GENERATOR_LIMITS.maxTournamentHistory + 2; index += 1) {
      useTournamentStore.getState().startTournament({
        ...created.value,
        id: `t-${index}`,
        createdAt: `2026-01-01T00:00:0${index % 10}.000Z`,
      });
    }

    expect(useTournamentStore.getState().tournamentHistory).toHaveLength(
      GENERATOR_LIMITS.maxTournamentHistory,
    );
    expect(useTournamentStore.getState().tournamentHistory[0]?.id).toBe(
      `t-${GENERATOR_LIMITS.maxTournamentHistory + 1}`,
    );

    useTournamentStore.getState().clearTournamentHistory();
    expect(useTournamentStore.getState().activeTournament).toBeNull();
    expect(useTournamentStore.getState().tournamentHistory).toEqual([]);
  });
});
