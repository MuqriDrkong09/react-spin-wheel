import type { HierarchicalSelectionResult } from '@/features/spin/utils/selectionFlow';
import type { SelectionStep } from '@/features/spin/utils/selectionPath';
import {
  SELECTION_MODE,
  SPIN_SESSION_STATUS,
  type SelectionMode,
  type SpinResult,
  type SpinSession,
} from '@/types/wheel';
import { createId } from '@/utils/id';

export function formatResultTimestamp(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString();
}

export function formatFinalResultPath(steps: readonly SelectionStep[]): string {
  return steps
    .map((step, index) => {
      const label = step.icon ? `${step.icon} ${step.name}` : step.name;
      return index === 0 ? label : `↓\n${label}`;
    })
    .join('\n');
}

export function formatFinalResultCopy(input: {
  wheelName: string;
  steps: readonly SelectionStep[];
  timestamp: string;
}): string {
  return [
    '🎉 Final result',
    input.wheelName,
    '',
    formatFinalResultPath(input.steps),
    '',
    formatResultTimestamp(input.timestamp),
  ].join('\n');
}

export function toSpinHistorySession(input: {
  result: HierarchicalSelectionResult;
  wheelName: string;
  mode?: SelectionMode;
}): SpinSession {
  const lastIndex = input.result.path.length - 1;
  const selectedItemId = input.result.selectedItemId;
  const selectedItemName = input.result.labels[lastIndex] ?? selectedItemId;
  const result: SpinResult = {
    id: createId(),
    sessionId: input.result.sessionId,
    wheelId: input.result.wheelId,
    itemId: selectedItemId,
    itemName: selectedItemName,
    selectedItemId,
    selectedItemName,
    parentItemId: lastIndex > 0 ? (input.result.path[lastIndex - 1] ?? null) : null,
    path: [...input.result.path],
    pathLabels: [...input.result.labels],
    depth: Math.max(0, lastIndex),
    probability: 1,
    timestamp: input.result.timestamp,
    spunAt: input.result.timestamp,
    duration: input.result.durationMs,
    mode: input.mode ?? SELECTION_MODE.manual,
  };

  return {
    id: result.id,
    wheelId: input.result.wheelId,
    wheelName: input.wheelName,
    status: SPIN_SESSION_STATUS.completed,
    results: [result],
    path: [...input.result.path],
    startedAt: input.result.timestamp,
    completedAt: input.result.timestamp,
  };
}
