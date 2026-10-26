import { useState } from 'react';

import { SPIN_STATUS } from '@/features/spin/constants';
import { useSpinWheel } from '@/features/spin/hooks/useSpinWheel';
import { isWheelItemBranch, type Wheel, type WheelItem } from '@/types/wheel';

export function useSpinSession(wheel: Wheel) {
  const [spinItems, setSpinItems] = useState<WheelItem[] | null>(null);
  const [winnerDismissed, setWinnerDismissed] = useState(false);
  const items = spinItems ?? wheel.items;
  const spin = useSpinWheel(items, {
    wheelSettings: wheel.settings,
  });
  const winnerOpen =
    spin.status === SPIN_STATUS.completed && Boolean(spin.result) && !winnerDismissed;

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
    const children =
      spin.result?.item && isWheelItemBranch(spin.result.item)
        ? spin.result.item.children
        : undefined;
    if (!children?.length) {
      return;
    }

    setWinnerDismissed(false);
    setSpinItems(children);
    spin.spinChildren(children);
  }

  return {
    items,
    spin,
    winnerOpen,
    winner: spin.result?.item,
    startSpin,
    closeWinner,
    spinAgain,
    spinChild,
  };
}
