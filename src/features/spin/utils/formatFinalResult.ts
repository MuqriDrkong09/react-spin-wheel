import type { HierarchicalSelectionResult } from '@/features/spin/utils/selectionFlow';
import type { SelectionStep } from '@/features/spin/utils/selectionPath';
import { SPIN_SESSION_STATUS, type SpinResult, type SpinSession } from '@/types/wheel';

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
}): SpinSession {
  const results: SpinResult[] = input.result.path.map((itemId, index) => ({
    id: `${input.result.sessionId}-${itemId}`,
    sessionId: input.result.sessionId,
    wheelId: input.result.wheelId,
    itemId,
    itemName: input.result.labels[index] ?? itemId,
    parentItemId: index > 0 ? (input.result.path[index - 1] ?? null) : null,
    path: input.result.path.slice(0, index + 1),
    depth: index,
    probability: 1,
    spunAt: input.result.timestamp,
  }));

  return {
    id: input.result.sessionId,
    wheelId: input.result.wheelId,
    wheelName: input.wheelName,
    status: SPIN_SESSION_STATUS.completed,
    results,
    path: [...input.result.path],
    startedAt: input.result.timestamp,
    completedAt: input.result.timestamp,
  };
}
