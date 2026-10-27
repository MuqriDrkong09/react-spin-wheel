import { create } from 'zustand';

import type { SpinSession, SpinSessionId } from '@/types/wheel';

interface HistoryStore {
  spinHistory: SpinSession[];
  addSpinSession: (session: SpinSession) => void;
  deleteSpinSession: (sessionId: SpinSessionId) => void;
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
  deleteSpinSession: (sessionId) =>
    set((state) => ({
      spinHistory: state.spinHistory.filter((session) => session.id !== sessionId),
    })),
  clearSpinHistory: () => set({ spinHistory: [] }),
}));

export function resetHistoryStore(): void {
  useHistoryStore.setState({ spinHistory: [] });
}
