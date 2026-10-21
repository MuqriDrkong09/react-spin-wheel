import { create } from 'zustand';

import type { SpinSession } from '@/types/wheel';

interface HistoryStore {
  spinHistory: SpinSession[];
  addSpinSession: (session: SpinSession) => void;
  clearSpinHistory: () => void;
}

const initialState = {
  spinHistory: [] as SpinSession[],
};

export const useHistoryStore = create<HistoryStore>((set) => ({
  ...initialState,
  addSpinSession: (session) =>
    set((state) => ({
      spinHistory: [session, ...state.spinHistory],
    })),
  clearSpinHistory: () => set({ spinHistory: [] }),
}));

export function resetHistoryStore(): void {
  useHistoryStore.setState({ spinHistory: [] });
}
