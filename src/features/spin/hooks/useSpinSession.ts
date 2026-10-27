import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { SPIN_STATUS } from '@/features/spin/constants';
import { useSpinWheel } from '@/features/spin/hooks/useSpinWheel';
import { excludeRemovedWinners, withRemovedWinner } from '@/features/spin/utils/removeWinner';
import {
  advanceSelectionLevel,
  canContinueSelection,
  createHierarchicalSelectionResult,
  selectionAfterWinner,
  shouldAutoAdvanceSelection,
  type HierarchicalSelectionResult,
} from '@/features/spin/utils/selectionFlow';
import { selectionPathNames, type SelectionStep } from '@/features/spin/utils/selectionPath';
import type { SpinLifecycleState } from '@/features/spin/utils/spinLifecycle';
import { SELECTION_MODE, type Wheel, type WheelItem, type WheelItemId } from '@/types/wheel';
import { createId } from '@/utils/id';

interface PendingAutomaticSpin {
  ancestors: SelectionStep[];
  items: WheelItem[];
}

function scheduleAfterPaint(onPainted: () => void): () => void {
  let secondFrame = 0;
  const firstFrame = requestAnimationFrame(() => {
    secondFrame = requestAnimationFrame(onPainted);
  });

  return () => {
    cancelAnimationFrame(firstFrame);
    cancelAnimationFrame(secondFrame);
  };
}

export function useSpinSession(wheel: Wheel) {
  const [sessionId, setSessionId] = useState(() => createId());
  const [spinItems, setSpinItems] = useState<WheelItem[] | null>(null);
  const [ancestors, setAncestors] = useState<SelectionStep[]>([]);
  const [winnerDismissed, setWinnerDismissed] = useState(false);
  const [autoHandoff, setAutoHandoff] = useState(false);
  const [finalOpen, setFinalOpen] = useState(false);
  const [finishedResult, setFinishedResult] = useState<HierarchicalSelectionResult>();
  const [removedWinnerIds, setRemovedWinnerIds] = useState<WheelItemId[]>([]);
  const cancelPaintWaitRef = useRef<() => void>(() => undefined);
  const pendingAutomaticSpinRef = useRef<PendingAutomaticSpin | null>(null);
  const pendingResumeSpinRef = useRef(false);
  const startPendingAutomaticSpinRef = useRef<() => void>(() => undefined);
  const sourceItems = spinItems ?? wheel.items;
  const items = excludeRemovedWinners(sourceItems, new Set(removedWinnerIds));
  const removeWinnerEnabled = wheel.settings.removeWinner ?? false;
  const spin = useSpinWheel(items, {
    wheelSettings: wheel.settings,
  });
  const winner = spin.status === SPIN_STATUS.completed ? spin.result?.item : undefined;
  const selection = selectionAfterWinner(ancestors, winner);
  const selectionMode = wheel.settings.selectionMode ?? SELECTION_MODE.manual;
  const canContinue = winner ? canContinueSelection(winner) : false;
  const willAutoAdvance = Boolean(
    winner && shouldAutoAdvanceSelection(selectionMode, ancestors, winner),
  );
  const winnerOpen =
    Boolean(winner) && !winnerDismissed && !willAutoAdvance && !autoHandoff && !finalOpen;
  const leafResult = useMemo(() => {
    if (!winner || canContinueSelection(winner)) {
      return undefined;
    }

    return createHierarchicalSelectionResult({
      sessionId,
      wheelId: wheel.id,
      selection: selectionAfterWinner(ancestors, winner),
    });
  }, [ancestors, sessionId, wheel.id, winner]);
  const result = finishedResult ?? leafResult;

  useEffect(() => {
    return () => {
      cancelPaintWaitRef.current();
    };
  }, []);

  function continueAutomatically(
    currentAncestors: SelectionStep[],
    lifecycle: SpinLifecycleState,
  ) {
    if (lifecycle.status !== SPIN_STATUS.completed) {
      return;
    }

    const item = lifecycle.result?.item;
    if (item && removeWinnerEnabled) {
      setRemovedWinnerIds((current) => withRemovedWinner(current, item.id));
    }
    if (!item || !shouldAutoAdvanceSelection(selectionMode, currentAncestors, item)) {
      setAutoHandoff(false);
      setWinnerDismissed(false);
      return;
    }

    const next = advanceSelectionLevel(currentAncestors, item);
    if (!next) {
      setAutoHandoff(false);
      setWinnerDismissed(false);
      return;
    }

    setAncestors(next.ancestors);
    setSpinItems(next.items);
    setWinnerDismissed(true);
    setAutoHandoff(true);
    setFinishedResult(undefined);
    startAutomaticChildSpin(next.ancestors, next.items);
  }

  function startAutomaticChildSpin(nextAncestors: SelectionStep[], nextItems: WheelItem[]) {
    if (spin.reducedMotion) {
      pendingAutomaticSpinRef.current = null;
      continueAutomatically(nextAncestors, spin.spinChildren(nextItems));
      return;
    }

    pendingAutomaticSpinRef.current = {
      ancestors: nextAncestors,
      items: nextItems,
    };
    startPendingAutomaticSpinRef.current = () => {
      continueAutomatically(nextAncestors, spin.spinChildren(nextItems));
    };
    spin.reset();
  }

  useLayoutEffect(() => {
    const pending = pendingAutomaticSpinRef.current;
    if (!pending || pending.items !== items) {
      return undefined;
    }

    cancelPaintWaitRef.current();
    cancelPaintWaitRef.current = scheduleAfterPaint(() => {
      pendingAutomaticSpinRef.current = null;
      startPendingAutomaticSpinRef.current();
    });

    return () => {
      cancelPaintWaitRef.current();
    };
  }, [items]);

  useLayoutEffect(() => {
    if (finalOpen || !pendingResumeSpinRef.current) {
      return undefined;
    }

    cancelPaintWaitRef.current();
    cancelPaintWaitRef.current = scheduleAfterPaint(() => {
      pendingResumeSpinRef.current = false;
      startPendingAutomaticSpinRef.current();
    });

    return () => {
      cancelPaintWaitRef.current();
    };
  }, [finalOpen]);

  function startSpin() {
    setWinnerDismissed(false);
    setAutoHandoff(false);
    setFinalOpen(false);
    setFinishedResult(undefined);
    continueAutomatically(ancestors, spin.spin());
  }

  function completeSpin() {
    continueAutomatically(ancestors, spin.complete());
  }

  function closeWinner() {
    setWinnerDismissed(true);
  }

  function spinAgain() {
    setWinnerDismissed(false);
    setAutoHandoff(false);
    setFinalOpen(false);
    setFinishedResult(undefined);
    continueAutomatically(ancestors, spin.spin());
  }

  function spinChild() {
    if (!winner) {
      return;
    }

    const next = advanceSelectionLevel(ancestors, winner);
    if (!next) {
      return;
    }

    setAncestors(next.ancestors);
    setSpinItems(next.items);
    setWinnerDismissed(true);
    setFinalOpen(false);
    setFinishedResult(undefined);
    spin.reset();
  }

  function resumeFromResult() {
    setWinnerDismissed(true);
    setAutoHandoff(false);
    setFinalOpen(false);
    setFinishedResult(undefined);
    spin.reset();
    if (selectionMode !== SELECTION_MODE.automatic) {
      return;
    }

    pendingResumeSpinRef.current = true;
    startPendingAutomaticSpinRef.current = () => {
      continueAutomatically(ancestors, spin.spin());
    };
  }

  function startNewSelection() {
    setSessionId(createId());
    setSpinItems(null);
    setAncestors([]);
    setWinnerDismissed(false);
    setAutoHandoff(false);
    setFinalOpen(false);
    setFinishedResult(undefined);
    spin.reset();
  }

  function restoreItems() {
    setRemovedWinnerIds([]);
  }

  function finish() {
    const next = createHierarchicalSelectionResult({
      sessionId,
      wheelId: wheel.id,
      selection,
    });
    setFinishedResult(next);
    setWinnerDismissed(true);
    setFinalOpen(Boolean(next));
    return next;
  }

  return {
    sessionId,
    items,
    ancestors,
    selection,
    path: selectionPathNames(selection),
    selectionMode,
    removeWinnerEnabled,
    canContinue,
    canRestoreItems: removedWinnerIds.length > 0,
    result,
    spin,
    winnerOpen,
    finalOpen,
    winner,
    startSpin,
    completeSpin,
    closeWinner,
    spinAgain,
    resumeFromResult,
    spinChild,
    startNewSelection,
    restoreItems,
    finish,
  };
}
