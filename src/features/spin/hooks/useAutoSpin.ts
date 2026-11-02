import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import {
  AUTO_SPIN_LIMITS,
  AUTO_SPIN_STATUS,
  SPIN_MESSAGES,
  SPIN_STATUS,
  type SpinStatus,
} from '@/features/spin/constants';
import {
  autoSpinCurrentIndex,
  autoSpinProgressPercent,
  isAutoSpinActive,
  parseAutoSpinCount,
  parseAutoSpinDelay,
  reduceAutoSpin,
  shouldKickoffAutoSpin,
  shouldRecordCompletedSpin,
  initialAutoSpinState,
} from '@/features/spin/utils/autoSpin';
import { createAutoSpinScheduler } from '@/features/spin/utils/autoSpinScheduler';
import type { HierarchicalSelectionResult } from '@/features/spin/utils/selectionFlow';

interface UseAutoSpinOptions {
  itemCount: number;
  spinStatus: SpinStatus;
  willAutoAdvance: boolean;
  sessionId: string;
  result: HierarchicalSelectionResult | undefined;
  startSpin: () => void;
  startNewSelection: () => void;
  onSave: (result: HierarchicalSelectionResult) => void;
}

export function useAutoSpin({
  itemCount,
  spinStatus,
  willAutoAdvance,
  sessionId,
  result,
  startSpin,
  startNewSelection,
  onSave,
}: UseAutoSpinOptions) {
  const [countInput, setCountInput] = useState(String(AUTO_SPIN_LIMITS.defaultCount));
  const [delayInput, setDelayInput] = useState(String(AUTO_SPIN_LIMITS.defaultDelayMs));
  const [saveResults, setSaveResults] = useState(true);
  const [state, dispatch] = useReducer(reduceAutoSpin, initialAutoSpinState);

  const schedulerRef = useRef(createAutoSpinScheduler());
  const kickoffRef = useRef(false);
  const itemCountRef = useRef(itemCount);
  const countInputRef = useRef(countInput);
  const delayInputRef = useRef(delayInput);
  const saveResultsRef = useRef(saveResults);
  const startSpinRef = useRef(startSpin);
  const startNewSelectionRef = useRef(startNewSelection);
  const onSaveRef = useRef(onSave);

  itemCountRef.current = itemCount;
  countInputRef.current = countInput;
  delayInputRef.current = delayInput;
  saveResultsRef.current = saveResults;
  startSpinRef.current = startSpin;
  startNewSelectionRef.current = startNewSelection;
  onSaveRef.current = onSave;

  const controlsLocked = isAutoSpinActive(state.status);

  useEffect(() => {
    const scheduler = schedulerRef.current;
    return () => {
      scheduler.cancel();
    };
  }, []);

  useEffect(() => {
    const action = shouldKickoffAutoSpin({
      pending: kickoffRef.current,
      status: state.status,
      spinStatus,
      itemCount,
    });

    if (action === 'wait') {
      return;
    }

    kickoffRef.current = false;

    if (action === 'empty') {
      schedulerRef.current.cancel();
      dispatch({ type: 'error', message: SPIN_MESSAGES.autoSpinNoItems });
      startNewSelectionRef.current();
      return;
    }

    startSpinRef.current();
    dispatch({ type: 'spinStarted' });
  }, [itemCount, sessionId, spinStatus, state.status]);

  useEffect(() => {
    if (
      !shouldRecordCompletedSpin({
        status: state.status,
        spinStatus,
        willAutoAdvance,
        hasWinner: Boolean(result),
      })
    ) {
      return;
    }

    if (!result) {
      schedulerRef.current.cancel();
      dispatch({ type: 'error', message: SPIN_MESSAGES.autoSpinFailed });
      startNewSelectionRef.current();
      return;
    }

    if (state.results.some((entry) => entry.sessionId === result.sessionId)) {
      return;
    }

    if (state.saveResults) {
      onSaveRef.current(result);
    }

    const stopping = state.status === AUTO_SPIN_STATUS.stopping;
    const nextCompleted = state.completed + 1;
    dispatch({
      type: 'spinRecorded',
      result: {
        index: nextCompleted,
        sessionId: result.sessionId,
        labels: result.labels,
        timestamp: result.timestamp,
      },
    });

    if (stopping || nextCompleted >= state.total) {
      startNewSelectionRef.current();
    }
  }, [
    result,
    spinStatus,
    state.completed,
    state.results,
    state.saveResults,
    state.status,
    state.total,
    willAutoAdvance,
  ]);

  useEffect(() => {
    if (state.status !== AUTO_SPIN_STATUS.delaying) {
      return undefined;
    }

    const scheduler = schedulerRef.current;
    scheduler.schedule(() => {
      if (itemCountRef.current <= 0) {
        dispatch({ type: 'error', message: SPIN_MESSAGES.autoSpinNoItems });
        startNewSelectionRef.current();
        return;
      }

      kickoffRef.current = true;
      startNewSelectionRef.current();
      dispatch({ type: 'delayElapsed' });
    }, state.delayMs);

    return () => {
      scheduler.cancel();
    };
  }, [state.completed, state.delayMs, state.status]);

  const start = useCallback(() => {
    if (controlsLocked || spinStatus === SPIN_STATUS.spinning) {
      return;
    }

    const count = parseAutoSpinCount(countInputRef.current);
    if (count == null) {
      dispatch({ type: 'error', message: SPIN_MESSAGES.autoSpinInvalidCount });
      return;
    }

    const delayMs = parseAutoSpinDelay(delayInputRef.current);
    if (delayMs == null) {
      dispatch({ type: 'error', message: SPIN_MESSAGES.autoSpinInvalidDelay });
      return;
    }

    if (itemCountRef.current <= 0) {
      dispatch({ type: 'error', message: SPIN_MESSAGES.autoSpinNoItems });
      return;
    }

    kickoffRef.current = true;
    dispatch({
      type: 'start',
      count,
      delayMs,
      saveResults: saveResultsRef.current,
    });
    startNewSelectionRef.current();
  }, [controlsLocked, spinStatus]);

  const stop = useCallback(() => {
    if (!controlsLocked) {
      return;
    }

    schedulerRef.current.cancel();
    dispatch({ type: 'stop' });

    if (state.status === AUTO_SPIN_STATUS.delaying) {
      startNewSelectionRef.current();
    }
  }, [controlsLocked, state.status]);

  return {
    countInput,
    delayInput,
    saveResults,
    setCountInput,
    setDelayInput,
    setSaveResults,
    status: state.status,
    error: state.error,
    results: state.results,
    total: state.total,
    completed: state.completed,
    currentIndex: autoSpinCurrentIndex(state),
    progressPercent: autoSpinProgressPercent(state.completed, state.total),
    controlsLocked,
    start,
    stop,
  };
}
