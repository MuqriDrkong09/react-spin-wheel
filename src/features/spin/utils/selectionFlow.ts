import {
  childItemsOf,
  completedSelectionPath,
  selectionPathIds,
  selectionPathNames,
  toSelectionStep,
  type SelectionStep,
} from '@/features/spin/utils/selectionPath';
import { nowIso } from '@/utils/id';
import {
  filterItemsByConditions,
  type ItemConditionContext,
} from '@/utils/itemConditions';
import {
  isWheelItemBranch,
  SELECTION_MODE,
  type IsoDateTime,
  type ItemCondition,
  type SelectionMode,
  type SpinSessionId,
  type WheelId,
  type WheelItem,
  type WheelItemId,
  type WheelItemPath,
} from '@/types/wheel';

export const SELECTION_DECISION = {
  continue: 'continue',
  finish: 'finish',
} as const;

export type SelectionDecision = (typeof SELECTION_DECISION)[keyof typeof SELECTION_DECISION];

export interface HierarchicalSelectionResult {
  sessionId: SpinSessionId;
  wheelId: WheelId;
  selectedItemId: WheelItemId;
  path: WheelItemPath;
  labels: string[];
  timestamp: IsoDateTime;
  durationMs: number;
}

export interface SelectionLevel {
  ancestors: SelectionStep[];
  items: WheelItem[];
}

/** Options for filtering child options by serializable wheel conditions. */
export interface SelectionConditionOptions {
  conditions?: readonly ItemCondition[];
  winCounts?: ItemConditionContext['winCounts'];
}

export function selectionPathWithItem(
  ancestors: readonly SelectionStep[],
  itemId: WheelItemId,
): WheelItemId[] {
  return [...ancestors.map((step) => step.id), itemId];
}

export function eligibleChildItems(
  parent: WheelItem,
  options: SelectionConditionOptions & {
    /** Selection path before including `parent` (ancestors only). */
    ancestorIds?: readonly WheelItemId[];
  } = {},
): WheelItem[] | undefined {
  const children = childItemsOf(parent);
  if (!children?.length) {
    return undefined;
  }

  const selectedItemIds = [...(options.ancestorIds ?? []), parent.id];
  const eligible = filterItemsByConditions(children, options.conditions, {
    selectedItemIds,
    winCounts: options.winCounts,
  });

  return eligible.length > 0 ? eligible : undefined;
}

export function selectionDecision(
  item: WheelItem,
  options?: SelectionConditionOptions & { ancestorIds?: readonly WheelItemId[] },
): SelectionDecision {
  if (options?.conditions?.length || options?.winCounts) {
    return eligibleChildItems(item, options)
      ? SELECTION_DECISION.continue
      : SELECTION_DECISION.finish;
  }

  return isWheelItemBranch(item) ? SELECTION_DECISION.continue : SELECTION_DECISION.finish;
}

export function canContinueSelection(
  item: WheelItem,
  options?: SelectionConditionOptions & { ancestorIds?: readonly WheelItemId[] },
): boolean {
  return selectionDecision(item, options) === SELECTION_DECISION.continue;
}

export const AUTO_SELECTION_MAX_STEPS = 64;

export function hasSelectionCycle(
  ancestors: readonly SelectionStep[],
  winnerId: WheelItemId,
): boolean {
  return ancestors.some((step) => step.id === winnerId);
}

export function canAutoAdvanceSelection(
  ancestors: readonly SelectionStep[],
  winner: WheelItem,
  options?: SelectionConditionOptions,
): boolean {
  if (
    !canContinueSelection(winner, {
      ...options,
      ancestorIds: ancestors.map((step) => step.id),
    })
  ) {
    return false;
  }

  if (hasSelectionCycle(ancestors, winner.id)) {
    return false;
  }

  return ancestors.length < AUTO_SELECTION_MAX_STEPS;
}

export function shouldAutoAdvanceSelection(
  mode: SelectionMode,
  ancestors: readonly SelectionStep[],
  winner: WheelItem,
  options?: SelectionConditionOptions,
): boolean {
  return mode === SELECTION_MODE.automatic && canAutoAdvanceSelection(ancestors, winner, options);
}

export function advanceSelectionLevel(
  ancestors: readonly SelectionStep[],
  winner: WheelItem,
  options?: SelectionConditionOptions,
): SelectionLevel | undefined {
  const items = eligibleChildItems(winner, {
    ...options,
    ancestorIds: ancestors.map((step) => step.id),
  });
  if (!items?.length) {
    return undefined;
  }

  return {
    ancestors: [...ancestors, toSelectionStep(winner)],
    items,
  };
}

/** Root-level options visible before any parent is selected. */
export function eligibleRootItems(
  items: readonly WheelItem[],
  options?: SelectionConditionOptions,
): WheelItem[] {
  return filterItemsByConditions(items, options?.conditions, {
    selectedItemIds: [],
    winCounts: options?.winCounts,
  });
}

export function createHierarchicalSelectionResult(input: {
  sessionId: SpinSessionId;
  wheelId: WheelId;
  selection: readonly SelectionStep[];
  timestamp?: IsoDateTime;
  durationMs?: number;
}): HierarchicalSelectionResult | undefined {
  const selected = input.selection[input.selection.length - 1];
  if (!selected) {
    return undefined;
  }

  return {
    sessionId: input.sessionId,
    wheelId: input.wheelId,
    selectedItemId: selected.id,
    path: selectionPathIds(input.selection),
    labels: selectionPathNames(input.selection),
    timestamp: input.timestamp ?? nowIso(),
    durationMs: input.durationMs ?? 0,
  };
}

export function selectionAfterWinner(
  ancestors: readonly SelectionStep[],
  winner?: Pick<WheelItem, 'id' | 'name' | 'icon'>,
): SelectionStep[] {
  return completedSelectionPath(ancestors, winner);
}
