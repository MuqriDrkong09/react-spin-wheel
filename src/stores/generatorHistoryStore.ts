import { create } from 'zustand';

import { GENERATOR_LIMITS } from '@/features/random-generator/constants';
import type { TeamGeneratorHistoryEntry } from '@/features/random-generator/types';

interface GeneratorHistoryStore {
  generatorHistory: TeamGeneratorHistoryEntry[];
  addTeamGeneration: (entry: TeamGeneratorHistoryEntry) => void;
  deleteTeamGeneration: (entryId: string) => void;
  clearTeamHistory: () => void;
}

const initialState = {
  generatorHistory: [] as TeamGeneratorHistoryEntry[],
};

export const useGeneratorHistoryStore = create<GeneratorHistoryStore>((set) => ({
  ...initialState,
  addTeamGeneration: (entry) =>
    set((state) => ({
      generatorHistory: [entry, ...state.generatorHistory].slice(0, GENERATOR_LIMITS.maxTeamHistory),
    })),
  deleteTeamGeneration: (entryId) =>
    set((state) => ({
      generatorHistory: state.generatorHistory.filter((entry) => entry.id !== entryId),
    })),
  clearTeamHistory: () => set({ generatorHistory: [] }),
}));

export function resetGeneratorHistoryStore(): void {
  useGeneratorHistoryStore.setState({ generatorHistory: [] });
}
