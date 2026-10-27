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
  isWheelItemBranch,
  SELECTION_MODE,
  type IsoDateTime,
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
}

export interface SelectionLevel {
  ancestors: SelectionStep[];
  items: WheelItem[];
}

export function selectionDecision(item: WheelItem): SelectionDecision {
  return isWheelItemBranch(item) ? SELECTION_DECISION.continue : SELECTION_DECISION.finish;
}

export function canContinueSelection(item: WheelItem): boolean {
  return selectionDecision(item) === SELECTION_DECISION.continue;
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
): boolean {
  if (!canContinueSelection(winner)) {
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
): boolean {
  return mode === SELECTION_MODE.automatic && canAutoAdvanceSelection(ancestors, winner);
}

export function advanceSelectionLevel(
  ancestors: readonly SelectionStep[],
  winner: WheelItem,
): SelectionLevel | undefined {
  const items = childItemsOf(winner);
  if (!items?.length) {
    return undefined;
  }

  return {
    ancestors: [...ancestors, toSelectionStep(winner)],
    items,
  };
}

export function createHierarchicalSelectionResult(input: {
  sessionId: SpinSessionId;
  wheelId: WheelId;
  selection: readonly SelectionStep[];
  timestamp?: IsoDateTime;
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
  };
}

export function selectionAfterWinner(
  ancestors: readonly SelectionStep[],
  winner?: Pick<WheelItem, 'id' | 'name' | 'icon'>,
): SelectionStep[] {
  return completedSelectionPath(ancestors, winner);
}
