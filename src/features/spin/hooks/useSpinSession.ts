import { useState } from 'react';

import { SPIN_STATUS } from '@/features/spin/constants';
import { useSpinWheel } from '@/features/spin/hooks/useSpinWheel';
import {
  childItemsOf,
  completedSelectionPath,
  selectionPathNames,
  toSelectionStep,
  type SelectionStep,
} from '@/features/spin/utils/selectionPath';
import type { Wheel, WheelItem } from '@/types/wheel';

export function useSpinSession(wheel: Wheel) {
  const [spinItems, setSpinItems] = useState<WheelItem[] | null>(null);
  const [ancestors, setAncestors] = useState<SelectionStep[]>([]);
  const [winnerDismissed, setWinnerDismissed] = useState(false);
  const items = spinItems ?? wheel.items;
  const spin = useSpinWheel(items, {
    wheelSettings: wheel.settings,
  });
  const winner = spin.status === SPIN_STATUS.completed ? spin.result?.item : undefined;
  const selection = completedSelectionPath(ancestors, winner);
  const winnerOpen = Boolean(winner) && !winnerDismissed;

  function startSpin() {
    setWinnerDismissed(false);
    spin.spin();
  }

  function closeWinner() {
    setWinnerDismissed(true);
  }

  function spinAgain() {
    setWinnerDismissed(false);
    spin.spin();
  }

  function spinChild() {
    if (!winner) {
      return;
    }

    const children = childItemsOf(winner);
    if (!children?.length) {
      return;
    }

    setAncestors((current) => [...current, toSelectionStep(winner)]);
    setSpinItems(children);
    setWinnerDismissed(true);
    spin.reset();
  }

  return {
    items,
    ancestors,
    selection,
    path: selectionPathNames(selection),
    spin,
    winnerOpen,
    winner,
    startSpin,
    closeWinner,
    spinAgain,
    spinChild,
  };
}
