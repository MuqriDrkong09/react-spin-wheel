import { create } from 'zustand';

import { GENERATOR_LIMITS } from '@/features/random-generator/constants';
import type { TournamentBracket } from '@/features/random-generator/types';
import { selectTournamentWinner } from '@/features/random-generator/utils/selectTournamentWinner';

interface TournamentStore {
  activeTournament: TournamentBracket | null;
  tournamentHistory: TournamentBracket[];
  startTournament: (bracket: TournamentBracket) => void;
  selectWinner: (matchId: string, winnerId: string) => void;
  deleteTournament: (bracketId: string) => void;
  clearTournamentHistory: () => void;
}

const initialState = {
  activeTournament: null as TournamentBracket | null,
  tournamentHistory: [] as TournamentBracket[],
};

export const useTournamentStore = create<TournamentStore>((set) => ({
  ...initialState,
  startTournament: (bracket) =>
    set((state) => ({
      activeTournament: bracket,
      tournamentHistory: [bracket, ...state.tournamentHistory].slice(0, GENERATOR_LIMITS.maxTournamentHistory),
    })),
  selectWinner: (matchId, winnerId) =>
    set((state) => {
      if (!state.activeTournament) {
        return state;
      }

      const result = selectTournamentWinner(state.activeTournament, matchId, winnerId);
      if (!result.ok) {
        return state;
      }

      return {
        activeTournament: result.value,
        tournamentHistory: state.tournamentHistory.map((entry) =>
          entry.id === result.value.id ? result.value : entry,
        ),
      };
    }),
  deleteTournament: (bracketId) =>
    set((state) => ({
      activeTournament: state.activeTournament?.id === bracketId ? null : state.activeTournament,
      tournamentHistory: state.tournamentHistory.filter((entry) => entry.id !== bracketId),
    })),
  clearTournamentHistory: () => set({ activeTournament: null, tournamentHistory: [] }),
}));

export function resetTournamentStore(): void {
  useTournamentStore.setState({ ...initialState });
}
