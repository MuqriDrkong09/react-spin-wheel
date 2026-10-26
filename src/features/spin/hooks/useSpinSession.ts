import { useMemo, useState } from 'react';

import { SPIN_STATUS } from '@/features/spin/constants';
import { useSpinWheel } from '@/features/spin/hooks/useSpinWheel';
import {
  advanceSelectionLevel,
  canContinueSelection,
  createHierarchicalSelectionResult,
  selectionAfterWinner,
  type HierarchicalSelectionResult,
} from '@/features/spin/utils/selectionFlow';
import { selectionPathNames, type SelectionStep } from '@/features/spin/utils/selectionPath';
import type { Wheel, WheelItem } from '@/types/wheel';
import { createId } from '@/utils/id';

export function useSpinSession(wheel: Wheel) {
  const [sessionId] = useState(() => createId());
  const [spinItems, setSpinItems] = useState<WheelItem[] | null>(null);
  const [ancestors, setAncestors] = useState<SelectionStep[]>([]);
  const [winnerDismissed, setWinnerDismissed] = useState(false);
  const [finishedResult, setFinishedResult] = useState<HierarchicalSelectionResult>();
  const items = spinItems ?? wheel.items;
  const spin = useSpinWheel(items, {
    wheelSettings: wheel.settings,
  });
  const winner = spin.status === SPIN_STATUS.completed ? spin.result?.item : undefined;
  const selection = selectionAfterWinner(ancestors, winner);
  const canContinue = winner ? canContinueSelection(winner) : false;
  const winnerOpen = Boolean(winner) && !winnerDismissed;
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

  function startSpin() {
    setWinnerDismissed(false);
    setFinishedResult(undefined);
    spin.spin();
  }

  function closeWinner() {
    setWinnerDismissed(true);
  }

  function spinAgain() {
    setWinnerDismissed(false);
    setFinishedResult(undefined);
    spin.spin();
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
    canContinue,
    result,
    spin,
    winnerOpen,
    winner,
    startSpin,
    closeWinner,
    spinAgain,
    spinChild,
    finish,
  };
}
