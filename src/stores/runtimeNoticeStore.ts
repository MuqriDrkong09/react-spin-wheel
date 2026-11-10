import { create } from 'zustand';

import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';

export type RuntimeNoticeKind =
  | 'storageUnavailable'
  | 'storageRecovered'
  | 'storageSaveFailed'
  | 'hierarchyRepaired';

export interface RuntimeNotice {
  kind: RuntimeNoticeKind;
  message: string;
}

interface RuntimeNoticeState {
  notice: RuntimeNotice | null;
  setNotice: (notice: RuntimeNotice | null) => void;
  dismissNotice: () => void;
}

const NOTICE_MESSAGES: Record<RuntimeNoticeKind, string> = {
  storageUnavailable: APP_ERROR_MESSAGES.storageUnavailable,
  storageRecovered: APP_ERROR_MESSAGES.storageRecovered,
  storageSaveFailed: APP_ERROR_MESSAGES.storageSaveFailed,
  hierarchyRepaired: APP_ERROR_MESSAGES.hierarchyRepaired,
};

export const useRuntimeNoticeStore = create<RuntimeNoticeState>((set) => ({
  notice: null,
  setNotice: (notice) => set({ notice }),
  dismissNotice: () => set({ notice: null }),
}));

export function reportRuntimeNotice(kind: RuntimeNoticeKind, message = NOTICE_MESSAGES[kind]) {
  useRuntimeNoticeStore.getState().setNotice({ kind, message });
}

export function resetRuntimeNoticeStore() {
  useRuntimeNoticeStore.setState({ notice: null });
}
