import { isWheelItemBranch, type WheelItem, type WheelItemPath } from '@/types/wheel';

export interface SelectionStep {
  id: string;
  name: string;
  icon?: string;
}

export function toSelectionStep(item: Pick<WheelItem, 'id' | 'name' | 'icon'>): SelectionStep {
  return item.icon
    ? { id: item.id, name: item.name, icon: item.icon }
    : { id: item.id, name: item.name };
}

export function selectionPathNames(path: readonly SelectionStep[]): string[] {
  return path.map((step) => step.name);
}

export function selectionPathIds(path: readonly SelectionStep[]): WheelItemPath {
  return path.map((step) => step.id);
}

export function childItemsOf(item: WheelItem): WheelItem[] | undefined {
  if (!isWheelItemBranch(item)) {
    return undefined;
  }

  return item.children.slice();
}

export function completedSelectionPath(
  ancestors: readonly SelectionStep[],
  winner?: Pick<WheelItem, 'id' | 'name' | 'icon'>,
): SelectionStep[] {
  if (!winner) {
    return [...ancestors];
  }

  return [...ancestors, toSelectionStep(winner)];
}
