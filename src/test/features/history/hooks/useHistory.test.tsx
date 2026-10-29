import { act, renderHook } from '@testing-library/react';

import {
  HISTORY_FILTER_ALL,
  HISTORY_PAGE_SIZE,
  HISTORY_SORT,
} from '@/features/history/constants';
import { useHistory } from '@/features/history/hooks/useHistory';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { SELECTION_MODE, SPIN_SESSION_STATUS, type SpinSession } from '@/types/wheel';

function historySession(
  id: string,
  extras: Partial<SpinSession> & {
    selectedItemName?: string;
    pathLabels?: string[];
    timestamp?: string;
    mode?: SpinSession['results'][number]['mode'];
    wheelName?: string;
    wheelId?: string;
  } = {},
): SpinSession {
  const selectedItemName = extras.selectedItemName ?? 'Large';
  const pathLabels = extras.pathLabels ?? ['Pizza', 'Chicken Pepperoni', 'Large'];
  const timestamp = extras.timestamp ?? `2026-01-0${id.slice(-1) || 1}T12:00:00.000Z`;
  const wheelId = extras.wheelId ?? 'pizza';
  const wheelName = extras.wheelName ?? 'Pizza Night';

  return {
    id,
    wheelId,
    wheelName,
    status: SPIN_SESSION_STATUS.completed,
    path: ['pizza', 'chicken-pepperoni', 'large'],
    startedAt: timestamp,
    completedAt: timestamp,
    results: [
      {
        id,
        sessionId: `session-${id}`,
        wheelId,
        itemId: 'large',
        itemName: selectedItemName,
        selectedItemId: 'large',
        selectedItemName,
        parentItemId: 'chicken-pepperoni',
        path: ['pizza', 'chicken-pepperoni', 'large'],
        pathLabels,
        depth: 2,
        probability: 1,
        timestamp,
        spunAt: timestamp,
        duration: 4000,
        mode: extras.mode ?? SELECTION_MODE.manual,
      },
    ],
    ...extras,
  };
}

function seedTwoResults() {
  useHistoryStore.getState().addSpinSession(
    historySession('r1', { timestamp: '2026-01-04T12:00:00.000Z' }),
  );
  useHistoryStore.getState().addSpinSession(
    historySession('r2', {
      wheelId: 'chores',
      wheelName: 'Chores',
      selectedItemName: 'Dishes',
      pathLabels: ['Dishes'],
      timestamp: '2026-01-05T12:00:00.000Z',
      mode: SELECTION_MODE.ask,
    }),
  );
}

describe('useHistory', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('starts empty with default filters', () => {
    const { result } = renderHook(() => useHistory());

    expect(result.current.hasHistory).toBe(false);
    expect(result.current.visible).toEqual([]);
    expect(result.current.wheels).toEqual([]);
    expect(result.current.search).toBe('');
    expect(result.current.wheelId).toBe(HISTORY_FILTER_ALL);
    expect(result.current.mode).toBe(HISTORY_FILTER_ALL);
    expect(result.current.sort).toBe(HISTORY_SORT.newest);
    expect(result.current.page).toBe(0);
    expect(result.current.pageSize).toBe(HISTORY_PAGE_SIZE);
    expect(result.current.selected).toBeNull();
    expect(result.current.pendingDelete).toBeNull();
    expect(result.current.clearOpen).toBe(false);
  });

  it('derives results, wheels, and newest-first visibility from the store', () => {
    seedTwoResults();
    const { result } = renderHook(() => useHistory());

    expect(result.current.hasHistory).toBe(true);
    expect(result.current.filteredCount).toBe(2);
    expect(result.current.visible.map((item) => item.id)).toEqual(['r2', 'r1']);
    expect(result.current.wheels.map((wheel) => wheel.id)).toEqual(['chores', 'pizza']);
  });

  it('filters by search, wheel, mode, and sort, and resets the page', () => {
    seedTwoResults();
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.setPage(1);
      result.current.setSearch('chicken');
    });
    expect(result.current.page).toBe(0);
    expect(result.current.visible.map((item) => item.id)).toEqual(['r1']);

    act(() => {
      result.current.setSearch('');
      result.current.setWheelId('chores');
    });
    expect(result.current.visible.map((item) => item.id)).toEqual(['r2']);

    act(() => {
      result.current.setWheelId(HISTORY_FILTER_ALL);
      result.current.setMode(SELECTION_MODE.ask);
    });
    expect(result.current.visible.map((item) => item.id)).toEqual(['r2']);

    act(() => {
      result.current.setMode(HISTORY_FILTER_ALL);
      result.current.setSort(HISTORY_SORT.oldest);
    });
    expect(result.current.visible.map((item) => item.id)).toEqual(['r1', 'r2']);
  });

  it('paginates and clamps an out-of-range page', () => {
    for (let index = 1; index <= 11; index += 1) {
      useHistoryStore.getState().addSpinSession(
        historySession(`r${index}`, {
          selectedItemName: `Item ${index}`,
          pathLabels: [`Item ${index}`],
          timestamp: `2026-01-${String(index).padStart(2, '0')}T12:00:00.000Z`,
        }),
      );
    }
    const { result } = renderHook(() => useHistory());

    expect(result.current.filteredCount).toBe(11);
    expect(result.current.visible).toHaveLength(HISTORY_PAGE_SIZE);

    act(() => {
      result.current.setPage(5);
    });
    expect(result.current.page).toBe(1);
    expect(result.current.visible).toHaveLength(1);

    act(() => {
      result.current.setPageSize(25);
    });
    expect(result.current.page).toBe(0);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.visible).toHaveLength(11);
  });

  it('opens and closes result details', () => {
    seedTwoResults();
    const { result } = renderHook(() => useHistory());
    const first = result.current.visible[0];

    act(() => {
      result.current.openDetails(first ?? null);
    });
    expect(result.current.selected?.id).toBe(first?.id);

    act(() => {
      result.current.closeDetails();
    });
    expect(result.current.selected).toBeNull();
  });

  it('stages, cancels, and confirms a pending delete', () => {
    seedTwoResults();
    const { result } = renderHook(() => useHistory());
    const dishes = result.current.visible.find((item) => item.id === 'r2');
    const pizza = result.current.visible.find((item) => item.id === 'r1');

    act(() => {
      result.current.openDetails(pizza ?? null);
      result.current.requestDelete(dishes ?? null);
    });
    expect(result.current.pendingDelete?.id).toBe('r2');

    act(() => {
      result.current.cancelDelete();
    });
    expect(result.current.pendingDelete).toBeNull();
    expect(useHistoryStore.getState().spinHistory).toHaveLength(2);

    act(() => {
      result.current.requestDelete(dishes ?? null);
    });
    act(() => {
      result.current.confirmDelete();
    });

    expect(result.current.pendingDelete).toBeNull();
    expect(useHistoryStore.getState().spinHistory.map((session) => session.id)).toEqual(['r1']);
    expect(result.current.selected?.id).toBe('r1');
  });

  it('clears the selected result when that result is deleted', () => {
    seedTwoResults();
    const { result } = renderHook(() => useHistory());
    const dishes = result.current.visible.find((item) => item.id === 'r2');

    act(() => {
      result.current.openDetails(dishes ?? null);
      result.current.requestDelete(dishes ?? null);
    });
    act(() => {
      result.current.confirmDelete();
    });

    expect(result.current.selected).toBeNull();
    expect(useHistoryStore.getState().spinHistory.map((session) => session.id)).toEqual(['r1']);
  });

  it('does not delete when confirming with no pending result', () => {
    seedTwoResults();
    const { result } = renderHook(() => useHistory());
    const pizza = result.current.visible.find((item) => item.id === 'r1');

    act(() => {
      result.current.openDetails(pizza ?? null);
      result.current.confirmDelete();
    });

    expect(useHistoryStore.getState().spinHistory).toHaveLength(2);
    expect(result.current.selected?.id).toBe('r1');
  });

  it('opens, cancels, and confirms clearing history', () => {
    seedTwoResults();
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.openDetails(result.current.visible[0] ?? null);
      result.current.setPage(1);
      result.current.requestClear();
    });
    expect(result.current.clearOpen).toBe(true);

    act(() => {
      result.current.cancelClear();
    });
    expect(result.current.clearOpen).toBe(false);
    expect(useHistoryStore.getState().spinHistory).toHaveLength(2);

    act(() => {
      result.current.requestClear();
    });
    act(() => {
      result.current.confirmClear();
    });

    expect(result.current.clearOpen).toBe(false);
    expect(result.current.hasHistory).toBe(false);
    expect(result.current.selected).toBeNull();
    expect(result.current.page).toBe(0);
    expect(useHistoryStore.getState().spinHistory).toHaveLength(0);
  });
});
