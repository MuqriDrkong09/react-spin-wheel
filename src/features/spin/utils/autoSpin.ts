import {
  AUTO_SPIN_LIMITS,
  AUTO_SPIN_STATUS,
  SPIN_STATUS,
  type AutoSpinStatus,
  type SpinStatus,
} from '@/features/spin/constants';

export interface AutoSpinEntry {
  index: number;
  sessionId: string;
  labels: readonly string[];
  timestamp: string;
}

export interface AutoSpinState {
  status: AutoSpinStatus;
  total: number;
  completed: number;
  delayMs: number;
  saveResults: boolean;
  results: AutoSpinEntry[];
  error: string | null;
}

export type AutoSpinEvent =
  | { type: 'start'; count: number; delayMs: number; saveResults: boolean }
  | { type: 'spinStarted' }
  | { type: 'spinRecorded'; result: AutoSpinEntry }
  | { type: 'delayElapsed' }
  | { type: 'stop' }
  | { type: 'error'; message: string }
  | { type: 'reset' };

export const initialAutoSpinState: AutoSpinState = {
  status: AUTO_SPIN_STATUS.idle,
  total: 0,
  completed: 0,
  delayMs: AUTO_SPIN_LIMITS.defaultDelayMs,
  saveResults: true,
  results: [],
  error: null,
};

export function isAutoSpinActive(status: AutoSpinStatus): boolean {
  return (
    status === AUTO_SPIN_STATUS.running ||
    status === AUTO_SPIN_STATUS.delaying ||
    status === AUTO_SPIN_STATUS.stopping
  );
}

export function parseAutoSpinCount(raw: string): number | undefined {
  const value = Number(raw.trim());
  if (!Number.isInteger(value)) {
    return undefined;
  }

  if (value < AUTO_SPIN_LIMITS.minCount || value > AUTO_SPIN_LIMITS.maxCount) {
    return undefined;
  }

  return value;
}

export function parseAutoSpinDelay(raw: string): number | undefined {
  const value = Number(raw.trim());
  if (!Number.isFinite(value) || value < AUTO_SPIN_LIMITS.minDelayMs) {
    return undefined;
  }

  const delayMs = Math.round(value);
  if (delayMs > AUTO_SPIN_LIMITS.maxDelayMs) {
    return undefined;
  }

  return delayMs;
}

export function autoSpinProgressPercent(completed: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((completed / total) * 100));
}

export function autoSpinCurrentIndex(state: Pick<AutoSpinState, 'status' | 'completed' | 'total'>): number {
  if (state.total <= 0) {
    return 0;
  }

  if (state.status === AUTO_SPIN_STATUS.running || state.status === AUTO_SPIN_STATUS.stopping) {
    return Math.min(state.completed + 1, state.total);
  }

  return Math.min(state.completed, state.total);
}

export function shouldRecordCompletedSpin(input: {
  status: AutoSpinStatus;
  spinStatus: SpinStatus;
  willAutoAdvance: boolean;
  hasWinner: boolean;
}): boolean {
  return (
    (input.status === AUTO_SPIN_STATUS.running || input.status === AUTO_SPIN_STATUS.stopping) &&
    input.spinStatus === SPIN_STATUS.completed &&
    !input.willAutoAdvance &&
    input.hasWinner
  );
}

export function shouldKickoffAutoSpin(input: {
  pending: boolean;
  status: AutoSpinStatus;
  spinStatus: SpinStatus;
  itemCount: number;
}): 'spin' | 'empty' | 'wait' {
  if (!input.pending) {
    return 'wait';
  }

  if (input.status !== AUTO_SPIN_STATUS.running) {
    return 'wait';
  }

  if (input.spinStatus === SPIN_STATUS.spinning) {
    return 'wait';
  }

  if (input.itemCount <= 0) {
    return 'empty';
  }

  return 'spin';
}

export function reduceAutoSpin(state: AutoSpinState, event: AutoSpinEvent): AutoSpinState {
  switch (event.type) {
    case 'start':
      return {
        status: AUTO_SPIN_STATUS.running,
        total: event.count,
        completed: 0,
        delayMs: event.delayMs,
        saveResults: event.saveResults,
        results: [],
        error: null,
      };
    case 'spinStarted':
      if (state.status !== AUTO_SPIN_STATUS.running) {
        return state;
      }

      return { ...state, error: null };
    case 'spinRecorded': {
      if (state.status !== AUTO_SPIN_STATUS.running && state.status !== AUTO_SPIN_STATUS.stopping) {
        return state;
      }

      if (state.results.some((entry) => entry.sessionId === event.result.sessionId)) {
        return state;
      }

      const completed = state.completed + 1;
      const results = [...state.results, { ...event.result, index: completed }];

      if (state.status === AUTO_SPIN_STATUS.stopping) {
        return {
          ...state,
          completed,
          results,
          status: AUTO_SPIN_STATUS.stopped,
          error: null,
        };
      }

      if (completed >= state.total) {
        return {
          ...state,
          completed,
          results,
          status: AUTO_SPIN_STATUS.completed,
          error: null,
        };
      }

      return {
        ...state,
        completed,
        results,
        status: AUTO_SPIN_STATUS.delaying,
        error: null,
      };
    }
    case 'delayElapsed':
      if (state.status !== AUTO_SPIN_STATUS.delaying) {
        return state;
      }

      return { ...state, status: AUTO_SPIN_STATUS.running };
    case 'stop':
      if (state.status === AUTO_SPIN_STATUS.delaying) {
        return { ...state, status: AUTO_SPIN_STATUS.stopped, error: null };
      }

      if (state.status === AUTO_SPIN_STATUS.running) {
        return { ...state, status: AUTO_SPIN_STATUS.stopping, error: null };
      }

      return state;
    case 'error':
      return {
        ...state,
        status: AUTO_SPIN_STATUS.error,
        error: event.message,
      };
    case 'reset':
      return initialAutoSpinState;
    default:
      return state;
  }
}
