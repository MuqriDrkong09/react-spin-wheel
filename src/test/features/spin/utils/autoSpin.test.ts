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
} from '@/features/spin/utils/autoSpin';

const pizza = {
  index: 1,
  sessionId: 's-1',
  labels: ['Pizza'],
  timestamp: '2026-01-01T00:00:00.000Z',
};

describe('autoSpin helpers', () => {
  it('parses spin counts and delays within the allowed range', () => {
    expect(parseAutoSpinCount('10')).toBe(10);
    expect(parseAutoSpinCount('1')).toBe(1);
    expect(parseAutoSpinCount('100')).toBe(100);
    expect(parseAutoSpinCount('0')).toBeUndefined();
    expect(parseAutoSpinCount('101')).toBeUndefined();
    expect(parseAutoSpinCount('2.5')).toBeUndefined();
    expect(parseAutoSpinCount('')).toBeUndefined();

    expect(parseAutoSpinDelay('0')).toBe(0);
    expect(parseAutoSpinDelay('500')).toBe(500);
    expect(parseAutoSpinDelay('10000')).toBe(10_000);
    expect(parseAutoSpinDelay('250.4')).toBe(250);
    expect(parseAutoSpinDelay('-1')).toBeUndefined();
    expect(parseAutoSpinDelay('10001')).toBeUndefined();
  });

  it('computes progress, current index, and active statuses', () => {
    expect(autoSpinProgressPercent(0, 10)).toBe(0);
    expect(autoSpinProgressPercent(3, 10)).toBe(30);
    expect(autoSpinProgressPercent(10, 10)).toBe(100);
    expect(autoSpinProgressPercent(1, 0)).toBe(0);

    expect(
      autoSpinCurrentIndex({ status: AUTO_SPIN_STATUS.running, completed: 2, total: 10 }),
    ).toBe(3);
    expect(
      autoSpinCurrentIndex({ status: AUTO_SPIN_STATUS.delaying, completed: 3, total: 10 }),
    ).toBe(3);
    expect(
      autoSpinCurrentIndex({ status: AUTO_SPIN_STATUS.completed, completed: 10, total: 10 }),
    ).toBe(10);

    expect(isAutoSpinActive(AUTO_SPIN_STATUS.running)).toBe(true);
    expect(isAutoSpinActive(AUTO_SPIN_STATUS.delaying)).toBe(true);
    expect(isAutoSpinActive(AUTO_SPIN_STATUS.stopping)).toBe(true);
    expect(isAutoSpinActive(AUTO_SPIN_STATUS.completed)).toBe(false);
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
        status: AUTO_SPIN_STATUS.running,
        spinStatus: SPIN_STATUS.completed,
        willAutoAdvance: true,
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

  it('ignores a duplicate session id so a completed spin is saved once', () => {
    let state = reduceAutoSpin(initialAutoSpinState, {
      type: 'start',
      count: 2,
      delayMs: 0,
      saveResults: true,
    });
    state = reduceAutoSpin(state, { type: 'spinRecorded', result: pizza });
    const delayed = reduceAutoSpin(state, { type: 'spinRecorded', result: pizza });

    expect(delayed).toBe(state);
    expect(delayed.completed).toBe(1);
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
});
