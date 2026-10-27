import type { WheelItem, WheelItemId } from '@/types/wheel';

export function excludeRemovedWinners(
  items: readonly WheelItem[],
  removedIds: ReadonlySet<WheelItemId>,
): WheelItem[] {
  if (removedIds.size === 0) {
    return items as WheelItem[];
  }

  let changed = false;
  const next: WheelItem[] = [];

  for (const item of items) {
    if (removedIds.has(item.id)) {
      changed = true;
      continue;
    }

    if (!item.children?.length) {
      next.push(item);
      continue;
    }

    const children = excludeRemovedWinners(item.children, removedIds);
    if (children === item.children) {
      next.push(item);
      continue;
    }

    changed = true;
    next.push({
      ...item,
      children,
    });
  }

  return changed ? next : (items as WheelItem[]);
}

export function withRemovedWinner(
  removedIds: readonly WheelItemId[],
  winnerId: WheelItemId,
): WheelItemId[] {
  return removedIds.includes(winnerId) ? [...removedIds] : [...removedIds, winnerId];
}
