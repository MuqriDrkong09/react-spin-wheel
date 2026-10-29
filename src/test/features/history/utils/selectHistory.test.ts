import { HISTORY_FILTER_ALL, HISTORY_SORT } from '@/features/history/constants';
import {
  paginateHistory,
  selectFilteredHistory,
  selectHistoryResults,
  selectHistoryWheels,
} from '@/features/history/utils/selectHistory';
import { SELECTION_MODE, SPIN_SESSION_STATUS, type SpinSession } from '@/types/wheel';

function session(
  overrides: Partial<SpinSession> &
    Pick<SpinSession, 'id' | 'wheelId' | 'wheelName'> & {
      selectedItemId?: string;
      selectedItemName?: string;
      pathLabels?: string[];
      timestamp?: string;
      duration?: number;
      mode?: SpinSession['results'][number]['mode'];
    },
): SpinSession {
  const selectedItemId = overrides.selectedItemId ?? 'large';
  const selectedItemName = overrides.selectedItemName ?? 'Large';
  const pathLabels = overrides.pathLabels ?? ['Pizza', 'Chicken Pepperoni', 'Large'];
  const timestamp = overrides.timestamp ?? '2026-01-04T00:00:00.000Z';

  return {
    status: SPIN_SESSION_STATUS.completed,
    path: ['pizza', 'chicken-pepperoni', 'large'],
    startedAt: timestamp,
    completedAt: timestamp,
    results: [
      {
        id: overrides.id,
        sessionId: 'session-1',
        wheelId: overrides.wheelId,
        itemId: selectedItemId,
        itemName: selectedItemName,
        selectedItemId,
        selectedItemName,
        parentItemId: 'chicken-pepperoni',
        path: ['pizza', 'chicken-pepperoni', 'large'],
        pathLabels,
        depth: 2,
        probability: 1,
        timestamp,
        spunAt: timestamp,
        duration: overrides.duration ?? 4000,
        mode: overrides.mode ?? SELECTION_MODE.manual,
      },
    ],
    ...overrides,
  };
}

const pizza = session({
  id: 'r1',
  wheelId: 'pizza',
  wheelName: 'Pizza Night',
  timestamp: '2026-01-04T12:00:00.000Z',
  duration: 4000,
});
const chores = session({
  id: 'r2',
  wheelId: 'chores',
  wheelName: 'Chores',
  selectedItemId: 'dishes',
  selectedItemName: 'Dishes',
  pathLabels: ['Dishes'],
  timestamp: '2026-01-05T12:00:00.000Z',
  duration: 900,
  mode: SELECTION_MODE.ask,
});

describe('selectHistory', () => {
  it('maps a completed selection onto a history row with the full path', () => {
    expect(selectHistoryResults([pizza])[0]).toEqual({
      id: 'r1',
      sessionId: 'session-1',
      wheelId: 'pizza',
      wheelName: 'Pizza Night',
      selectedItemId: 'large',
      selectedItemName: 'Large',
      path: ['pizza', 'chicken-pepperoni', 'large'],
      pathLabels: ['Pizza', 'Chicken Pepperoni', 'Large'],
      pathLabel: 'Pizza → Chicken Pepperoni → Large',
      timestamp: '2026-01-04T12:00:00.000Z',
      duration: 4000,
      mode: SELECTION_MODE.manual,
    });
  });

  it('searches, filters, and sorts results', () => {
    const results = selectHistoryResults([pizza, chores]);

    expect(selectHistoryWheels(results).map((wheel) => wheel.name)).toEqual(['Chores', 'Pizza Night']);
    expect(
      selectFilteredHistory(results, 'chicken', HISTORY_FILTER_ALL, HISTORY_FILTER_ALL, HISTORY_SORT.newest).map(
        (entry) => entry.id,
      ),
    ).toEqual(['r1']);
    expect(
      selectFilteredHistory(results, '', 'chores', HISTORY_FILTER_ALL, HISTORY_SORT.newest).map(
        (entry) => entry.id,
      ),
    ).toEqual(['r2']);
    expect(
      selectFilteredHistory(results, '', HISTORY_FILTER_ALL, SELECTION_MODE.ask, HISTORY_SORT.newest).map(
        (entry) => entry.id,
      ),
    ).toEqual(['r2']);
    expect(
      selectFilteredHistory(results, '', HISTORY_FILTER_ALL, HISTORY_FILTER_ALL, HISTORY_SORT.oldest).map(
        (entry) => entry.id,
      ),
    ).toEqual(['r1', 'r2']);
    expect(
      selectFilteredHistory(results, '', HISTORY_FILTER_ALL, HISTORY_FILTER_ALL, HISTORY_SORT.duration).map(
        (entry) => entry.id,
      ),
    ).toEqual(['r1', 'r2']);
  });

  it('paginates filtered results', () => {
    const results = selectHistoryResults([pizza, chores]);
    expect(paginateHistory(results, 0, 1).map((entry) => entry.id)).toEqual(['r1']);
    expect(paginateHistory(results, 1, 1).map((entry) => entry.id)).toEqual(['r2']);
  });
});
