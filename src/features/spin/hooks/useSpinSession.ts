import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { SPIN_STATUS } from '@/features/spin/constants';
import { useSpinWheel } from '@/features/spin/hooks/useSpinWheel';
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
import { SELECTION_MODE, type Wheel, type WheelItem } from '@/types/wheel';
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
  const [sessionId] = useState(() => createId());
  const [spinItems, setSpinItems] = useState<WheelItem[] | null>(null);
  const [ancestors, setAncestors] = useState<SelectionStep[]>([]);
  const [winnerDismissed, setWinnerDismissed] = useState(false);
  const [autoHandoff, setAutoHandoff] = useState(false);
  const [finishedResult, setFinishedResult] = useState<HierarchicalSelectionResult>();
  const cancelPaintWaitRef = useRef<() => void>(() => undefined);
  const pendingAutomaticSpinRef = useRef<PendingAutomaticSpin | null>(null);
  const startPendingAutomaticSpinRef = useRef<() => void>(() => undefined);
  const items = spinItems ?? wheel.items;
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
  const winnerOpen = Boolean(winner) && !winnerDismissed && !willAutoAdvance && !autoHandoff;
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

  function startSpin() {
    setWinnerDismissed(false);
    setAutoHandoff(false);
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
    setFinishedResult(undefined);
    spin.reset();
  }

  function finish() {
    const next = createHierarchicalSelectionResult({
      sessionId,
      wheelId: wheel.id,
      selection,
    });
    setFinishedResult(next);
    return next;
  }

  return {
    sessionId,
    items,
    ancestors,
    selection,
    path: selectionPathNames(selection),
    selectionMode,
    canContinue,
    result,
    spin,
    winnerOpen,
    winner,
    startSpin,
    completeSpin,
    closeWinner,
    spinAgain,
    spinChild,
    finish,
  };
}
