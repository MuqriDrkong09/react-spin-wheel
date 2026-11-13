import { AUTO_SPIN_STATUS, SPIN_MESSAGES, SPIN_STATUS } from '@/features/spin/constants';
import {
  autoSpinCurrentIndex,
  autoSpinProgressPercent,
  initialAutoSpinState,
  isAutoSpinActive,
  parseAutoSpinCount,
  parseAutoSpinDelay,
  reduceAutoSpin,
  shouldKickoffAutoSpin,
  shouldRecordCompletedSpin,
  type AutoSpinEvent,
  type AutoSpinState,
} from '@/features/spin/utils/autoSpin';

const pizza = {
  index: 1,
  sessionId: 's-1',
  labels: ['Pizza'],
  timestamp: '2026-01-01T00:00:00.000Z',
};

function runningState(overrides: Partial<AutoSpinState> = {}): AutoSpinState {
  return {
    status: AUTO_SPIN_STATUS.running,
    total: 3,
    completed: 0,
    delayMs: 400,
    saveResults: true,
    results: [],
    error: null,
    ...overrides,
  };
}

describe('autoSpin helpers', () => {
  it('parses spin counts and delays within the allowed range', () => {
    expect(parseAutoSpinCount('10')).toBe(10);
    expect(parseAutoSpinCount('1')).toBe(1);
    expect(parseAutoSpinCount('100')).toBe(100);
    expect(parseAutoSpinCount(' 7 ')).toBe(7);
    expect(parseAutoSpinCount('0')).toBeUndefined();
    expect(parseAutoSpinCount('101')).toBeUndefined();
    expect(parseAutoSpinCount('2.5')).toBeUndefined();
    expect(parseAutoSpinCount('')).toBeUndefined();
    expect(parseAutoSpinCount('abc')).toBeUndefined();

    expect(parseAutoSpinDelay('0')).toBe(0);
    expect(parseAutoSpinDelay('500')).toBe(500);
    expect(parseAutoSpinDelay('10000')).toBe(10_000);
    expect(parseAutoSpinDelay('250.4')).toBe(250);
    expect(parseAutoSpinDelay('-1')).toBeUndefined();
    expect(parseAutoSpinDelay('10001')).toBeUndefined();
    expect(parseAutoSpinDelay('Infinity')).toBeUndefined();
    expect(parseAutoSpinDelay('NaN')).toBeUndefined();
  });

  it('computes progress, current index, and active statuses', () => {
    expect(autoSpinProgressPercent(0, 10)).toBe(0);
    expect(autoSpinProgressPercent(3, 10)).toBe(30);
    expect(autoSpinProgressPercent(10, 10)).toBe(100);
    expect(autoSpinProgressPercent(1, 0)).toBe(0);
    expect(autoSpinProgressPercent(11, 10)).toBe(100);

    expect(
      autoSpinCurrentIndex({ status: AUTO_SPIN_STATUS.running, completed: 2, total: 10 }),
    ).toBe(3);
    expect(
      autoSpinCurrentIndex({ status: AUTO_SPIN_STATUS.stopping, completed: 9, total: 10 }),
    ).toBe(10);
    expect(
      autoSpinCurrentIndex({ status: AUTO_SPIN_STATUS.delaying, completed: 3, total: 10 }),
    ).toBe(3);
    expect(
      autoSpinCurrentIndex({ status: AUTO_SPIN_STATUS.completed, completed: 10, total: 10 }),
    ).toBe(10);
    expect(
      autoSpinCurrentIndex({ status: AUTO_SPIN_STATUS.idle, completed: 0, total: 0 }),
    ).toBe(0);

    expect(isAutoSpinActive(AUTO_SPIN_STATUS.running)).toBe(true);
    expect(isAutoSpinActive(AUTO_SPIN_STATUS.delaying)).toBe(true);
    expect(isAutoSpinActive(AUTO_SPIN_STATUS.stopping)).toBe(true);
    expect(isAutoSpinActive(AUTO_SPIN_STATUS.completed)).toBe(false);
    expect(isAutoSpinActive(AUTO_SPIN_STATUS.idle)).toBe(false);
  });

  it('kicks off the next spin only while a run is pending and items remain', () => {
    expect(
      shouldKickoffAutoSpin({
        pending: true,
        status: AUTO_SPIN_STATUS.running,
        spinStatus: SPIN_STATUS.idle,
        itemCount: 3,
      }),
    ).toBe('spin');
    expect(
      shouldKickoffAutoSpin({
        pending: true,
        status: AUTO_SPIN_STATUS.running,
        spinStatus: SPIN_STATUS.idle,
        itemCount: 0,
      }),
    ).toBe('empty');
    expect(
      shouldKickoffAutoSpin({
        pending: false,
        status: AUTO_SPIN_STATUS.running,
        spinStatus: SPIN_STATUS.idle,
        itemCount: 3,
      }),
    ).toBe('wait');
    expect(
      shouldKickoffAutoSpin({
        pending: true,
        status: AUTO_SPIN_STATUS.delaying,
        spinStatus: SPIN_STATUS.idle,
        itemCount: 3,
      }),
    ).toBe('wait');
    expect(
      shouldKickoffAutoSpin({
        pending: true,
        status: AUTO_SPIN_STATUS.running,
        spinStatus: SPIN_STATUS.spinning,
        itemCount: 3,
      }),
    ).toBe('wait');
  });

  it('records a completed leaf only while auto spin is in flight', () => {
    expect(
      shouldRecordCompletedSpin({
        status: AUTO_SPIN_STATUS.running,
        spinStatus: SPIN_STATUS.completed,
        willAutoAdvance: false,
        hasWinner: true,
      }),
    ).toBe(true);
    expect(
      shouldRecordCompletedSpin({
        status: AUTO_SPIN_STATUS.stopping,
        spinStatus: SPIN_STATUS.completed,
        willAutoAdvance: false,
        hasWinner: true,
      }),
    ).toBe(true);
    expect(
      shouldRecordCompletedSpin({
        status: AUTO_SPIN_STATUS.running,
        spinStatus: SPIN_STATUS.completed,
        willAutoAdvance: true,
        hasWinner: true,
      }),
    ).toBe(false);
    expect(
      shouldRecordCompletedSpin({
        status: AUTO_SPIN_STATUS.running,
        spinStatus: SPIN_STATUS.completed,
        willAutoAdvance: false,
        hasWinner: false,
      }),
    ).toBe(false);
    expect(
      shouldRecordCompletedSpin({
        status: AUTO_SPIN_STATUS.running,
        spinStatus: SPIN_STATUS.spinning,
        willAutoAdvance: false,
        hasWinner: true,
      }),
    ).toBe(false);
    expect(
      shouldRecordCompletedSpin({
        status: AUTO_SPIN_STATUS.delaying,
        spinStatus: SPIN_STATUS.completed,
        willAutoAdvance: false,
        hasWinner: true,
      }),
    ).toBe(false);
  });
});

describe('reduceAutoSpin', () => {
  it('runs N spins, delays between them, then completes', () => {
    let state = reduceAutoSpin(initialAutoSpinState, {
      type: 'start',
      count: 3,
      delayMs: 400,
      saveResults: true,
    });
    expect(state.status).toBe(AUTO_SPIN_STATUS.running);
    expect(state.total).toBe(3);

    state = reduceAutoSpin(state, { type: 'spinStarted' });
    expect(state).toEqual(expect.objectContaining({ status: AUTO_SPIN_STATUS.running, error: null }));

    state = reduceAutoSpin(state, { type: 'spinRecorded', result: pizza });
    expect(state.status).toBe(AUTO_SPIN_STATUS.delaying);
    expect(state.results[0]?.labels).toEqual(['Pizza']);
    expect(SPIN_MESSAGES.autoSpinResult(1, ['Pizza'])).toBe('Spin 1 → Pizza');

    state = reduceAutoSpin(state, { type: 'delayElapsed' });
    expect(state.status).toBe(AUTO_SPIN_STATUS.running);

    state = reduceAutoSpin(state, {
      type: 'spinRecorded',
      result: { ...pizza, sessionId: 's-2', labels: ['Burger'] },
    });
    state = reduceAutoSpin(state, { type: 'delayElapsed' });
    state = reduceAutoSpin(state, {
      type: 'spinRecorded',
      result: { ...pizza, sessionId: 's-3', labels: ['Sushi'] },
    });

    expect(state.status).toBe(AUTO_SPIN_STATUS.completed);
    expect(state.completed).toBe(3);
    expect(state.results.map((entry) => entry.labels[0])).toEqual(['Pizza', 'Burger', 'Sushi']);
  });

  it('ignores spinStarted unless a run is active', () => {
    const idle = reduceAutoSpin(initialAutoSpinState, { type: 'spinStarted' });
    expect(idle).toBe(initialAutoSpinState);
  });

  it('ignores a duplicate session id so a completed spin is saved once', () => {
    const state = runningState({
      completed: 1,
      results: [pizza],
    });
    const duplicate = reduceAutoSpin(state, { type: 'spinRecorded', result: pizza });

    expect(duplicate).toBe(state);
    expect(duplicate.completed).toBe(1);
  });

  it('ignores spinRecorded when auto spin is not in flight', () => {
    const delaying = runningState({
      status: AUTO_SPIN_STATUS.delaying,
      completed: 1,
      results: [pizza],
    });
    expect(reduceAutoSpin(delaying, { type: 'spinRecorded', result: { ...pizza, sessionId: 's-2' } })).toBe(
      delaying,
    );
  });

  it('stops after the in-flight spin when stop is requested while running', () => {
    let state = reduceAutoSpin(initialAutoSpinState, {
      type: 'start',
      count: 10,
      delayMs: 500,
      saveResults: true,
    });
    state = reduceAutoSpin(state, { type: 'stop' });
    expect(state.status).toBe(AUTO_SPIN_STATUS.stopping);

    state = reduceAutoSpin(state, { type: 'spinRecorded', result: pizza });
    expect(state.status).toBe(AUTO_SPIN_STATUS.stopped);
    expect(state.completed).toBe(1);
  });

  it('stops immediately while waiting between spins', () => {
    let state = reduceAutoSpin(initialAutoSpinState, {
      type: 'start',
      count: 10,
      delayMs: 500,
      saveResults: false,
    });
    state = reduceAutoSpin(state, { type: 'spinRecorded', result: pizza });
    state = reduceAutoSpin(state, { type: 'stop' });

    expect(state.status).toBe(AUTO_SPIN_STATUS.stopped);
    expect(state.saveResults).toBe(false);
  });

  it('ignores stop and delayElapsed outside their active statuses', () => {
    expect(reduceAutoSpin(initialAutoSpinState, { type: 'stop' })).toBe(initialAutoSpinState);
    expect(reduceAutoSpin(initialAutoSpinState, { type: 'delayElapsed' })).toBe(initialAutoSpinState);

    const stopping = runningState({ status: AUTO_SPIN_STATUS.stopping });
    expect(reduceAutoSpin(stopping, { type: 'stop' })).toBe(stopping);
  });

  it('records errors and can reset back to idle', () => {
    let state = reduceAutoSpin(initialAutoSpinState, {
      type: 'start',
      count: 2,
      delayMs: 0,
      saveResults: true,
    });
    state = reduceAutoSpin(state, { type: 'error', message: SPIN_MESSAGES.autoSpinNoItems });
    expect(state.status).toBe(AUTO_SPIN_STATUS.error);
    expect(state.error).toBe(SPIN_MESSAGES.autoSpinNoItems);

    state = reduceAutoSpin(state, { type: 'reset' });
    expect(state).toEqual(initialAutoSpinState);
  });

  it('returns the current state for unknown events', () => {
    const state = runningState();
    expect(reduceAutoSpin(state, { type: 'noop' } as unknown as AutoSpinEvent)).toBe(state);
  });
});
