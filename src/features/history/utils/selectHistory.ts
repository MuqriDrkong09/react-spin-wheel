import {
  HISTORY_FILTER_ALL,
  HISTORY_SORT,
  type HistorySort,
} from '@/features/history/constants';
import { SELECTION_MODE, type SelectionMode, type SpinSession } from '@/types/wheel';

export interface HistoryResult {
  id: string;
  sessionId: string;
  wheelId: string;
  wheelName: string;
  selectedItemId: string;
  selectedItemName: string;
  path: string[];
  pathLabels: string[];
  pathLabel: string;
  timestamp: string;
  duration: number;
  mode: SelectionMode;
}

export function toHistoryResult(session: SpinSession): HistoryResult | undefined {
  const last = session.results[session.results.length - 1];
  if (!last) {
    return undefined;
  }

  const pathLabels =
    last.pathLabels && last.pathLabels.length > 0
      ? [...last.pathLabels]
      : session.results.map((entry) => entry.selectedItemName ?? entry.itemName);
  const selectedItemId = last.selectedItemId ?? last.itemId;
  const selectedItemName = last.selectedItemName ?? last.itemName;
  const timestamp = last.timestamp ?? last.spunAt;

  return {
    id: session.id,
    sessionId: last.sessionId,
    wheelId: session.wheelId,
    wheelName: session.wheelName,
    selectedItemId,
    selectedItemName,
    path: last.path.length > 0 ? [...last.path] : [...session.path],
    pathLabels,
    pathLabel: pathLabels.join(' → '),
    timestamp,
    duration: last.duration ?? 0,
    mode: last.mode ?? SELECTION_MODE.manual,
  };
}

export function selectHistoryResults(spinHistory: readonly SpinSession[]): HistoryResult[] {
  return spinHistory
    .map(toHistoryResult)
    .filter((entry): entry is HistoryResult => Boolean(entry));
}

export function selectHistoryWheels(results: readonly HistoryResult[]): { id: string; name: string }[] {
  const seen = new Map<string, string>();

  for (const result of results) {
    if (!seen.has(result.wheelId)) {
      seen.set(result.wheelId, result.wheelName);
    }
  }

  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function selectFilteredHistory(
  results: readonly HistoryResult[],
  search: string,
  wheelId: string,
  mode: string,
  sort: HistorySort,
): HistoryResult[] {
  const query = search.trim().toLowerCase();

  const filtered = results.filter((result) => {
    const matchesWheel = wheelId === HISTORY_FILTER_ALL || result.wheelId === wheelId;
    const matchesMode = mode === HISTORY_FILTER_ALL || result.mode === mode;
    const matchesSearch =
      query.length === 0 ||
      result.pathLabel.toLowerCase().includes(query) ||
      result.selectedItemName.toLowerCase().includes(query) ||
      result.wheelName.toLowerCase().includes(query);

    return matchesWheel && matchesMode && matchesSearch;
  });

  return [...filtered].sort((left, right) => compareHistory(left, right, sort));
}

export function paginateHistory(
  results: readonly HistoryResult[],
  page: number,
  pageSize: number,
): HistoryResult[] {
  const start = page * pageSize;
  return results.slice(start, start + pageSize);
}

function compareHistory(left: HistoryResult, right: HistoryResult, sort: HistorySort): number {
  if (sort === HISTORY_SORT.oldest) {
    return left.timestamp.localeCompare(right.timestamp);
  }

  if (sort === HISTORY_SORT.wheelName) {
    const name = left.wheelName.localeCompare(right.wheelName);
    return name !== 0 ? name : right.timestamp.localeCompare(left.timestamp);
  }

  if (sort === HISTORY_SORT.duration) {
    return right.duration - left.duration;
  }

  return right.timestamp.localeCompare(left.timestamp);
}
