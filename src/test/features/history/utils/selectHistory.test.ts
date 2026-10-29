import { HISTORY_FILTER_ALL, HISTORY_SORT } from '@/features/history/constants';
import {
  paginateHistory,
  selectFilteredHistory,
  selectHistoryResults,
  selectHistoryWheels,
  toHistoryResult,
} from '@/features/history/utils/selectHistory';
import { SELECTION_MODE, SPIN_SESSION_STATUS, type SpinResult, type SpinSession } from '@/types/wheel';

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
    expect(
      selectFilteredHistory(results, '', HISTORY_FILTER_ALL, HISTORY_FILTER_ALL, HISTORY_SORT.newest).map(
        (entry) => entry.id,
      ),
    ).toEqual(['r2', 'r1']);
    expect(
      selectFilteredHistory(results, '', HISTORY_FILTER_ALL, HISTORY_FILTER_ALL, HISTORY_SORT.wheelName).map(
        (entry) => entry.id,
      ),
    ).toEqual(['r2', 'r1']);
    expect(
      selectFilteredHistory(results, '  dishes  ', HISTORY_FILTER_ALL, HISTORY_FILTER_ALL, HISTORY_SORT.newest).map(
        (entry) => entry.id,
      ),
    ).toEqual(['r2']);
    expect(
      selectFilteredHistory(results, 'pizza night', HISTORY_FILTER_ALL, HISTORY_FILTER_ALL, HISTORY_SORT.newest).map(
        (entry) => entry.id,
      ),
    ).toEqual(['r1']);
  });

  it('paginates filtered results', () => {
    const results = selectHistoryResults([pizza, chores]);
    expect(paginateHistory(results, 0, 1).map((entry) => entry.id)).toEqual(['r1']);
    expect(paginateHistory(results, 1, 1).map((entry) => entry.id)).toEqual(['r2']);
  });

  it('skips sessions with no results', () => {
    const empty = session({
      id: 'empty',
      wheelId: 'pizza',
      wheelName: 'Pizza Night',
      results: [],
    });

    expect(toHistoryResult(empty)).toBeUndefined();
    expect(selectHistoryResults([empty, pizza])).toHaveLength(1);
  });

  it('falls back when path labels, ids, names, timestamp, path, duration, or mode are missing', () => {
    const fallback = session({
      id: 'fallback',
      wheelId: 'pizza',
      wheelName: 'Pizza Night',
      path: ['session-path'],
      results: [
        {
          id: 'child',
          sessionId: 'session-fallback',
          wheelId: 'pizza',
          itemId: 'item-id',
          itemName: 'Item Name',
          selectedItemId: undefined as unknown as string,
          selectedItemName: undefined as unknown as string,
          parentItemId: null,
          path: [],
          pathLabels: [],
          depth: 0,
          probability: 1,
          timestamp: undefined as unknown as string,
          spunAt: '2026-01-08T12:00:00.000Z',
          duration: undefined as unknown as number,
          mode: undefined as unknown as SpinResult['mode'],
        },
      ],
    });

    expect(toHistoryResult(fallback)).toMatchObject({
      selectedItemId: 'item-id',
      selectedItemName: 'Item Name',
      path: ['session-path'],
      pathLabels: ['Item Name'],
      pathLabel: 'Item Name',
      timestamp: '2026-01-08T12:00:00.000Z',
      duration: 0,
      mode: SELECTION_MODE.manual,
    });
  });

  it('uses selected item names for path labels when labels are omitted', () => {
    const mapped = session({
      id: 'mapped',
      wheelId: 'pizza',
      wheelName: 'Pizza Night',
      results: [
        {
          id: 'first',
          sessionId: 'session-mapped',
          wheelId: 'pizza',
          itemId: 'pizza',
          itemName: 'Pizza',
          selectedItemName: 'Pizza Slice',
          parentItemId: null,
          path: ['pizza'],
          pathLabels: undefined as unknown as string[],
          depth: 0,
          probability: 1,
          timestamp: '2026-01-08T12:00:00.000Z',
          spunAt: '2026-01-08T12:00:00.000Z',
          duration: 1000,
          mode: SELECTION_MODE.manual,
        },
        {
          id: 'second',
          sessionId: 'session-mapped',
          wheelId: 'pizza',
          itemId: 'large',
          itemName: 'Large',
          selectedItemName: undefined as unknown as string,
          parentItemId: 'pizza',
          path: ['pizza', 'large'],
          pathLabels: undefined as unknown as string[],
          depth: 1,
          probability: 1,
          timestamp: '2026-01-08T12:00:01.000Z',
          spunAt: '2026-01-08T12:00:01.000Z',
          duration: 1000,
          mode: SELECTION_MODE.manual,
        },
      ],
    });

    expect(toHistoryResult(mapped)?.pathLabels).toEqual(['Pizza Slice', 'Large']);
  });

  it('keeps the first name for a duplicate wheel and breaks wheel-name ties by newest', () => {
    const laterPizza = session({
      id: 'r3',
      wheelId: 'pizza',
      wheelName: 'Pizza Night',
      timestamp: '2026-01-06T12:00:00.000Z',
    });
    const results = selectHistoryResults([pizza, chores, laterPizza]);

    expect(selectHistoryWheels(results)).toEqual([
      { id: 'chores', name: 'Chores' },
      { id: 'pizza', name: 'Pizza Night' },
    ]);
    expect(
      selectFilteredHistory(results, '', HISTORY_FILTER_ALL, HISTORY_FILTER_ALL, HISTORY_SORT.wheelName).map(
        (entry) => entry.id,
      ),
    ).toEqual(['r2', 'r3', 'r1']);
  });
});
