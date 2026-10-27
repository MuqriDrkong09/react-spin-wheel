import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { SELECTION_MODE, SPIN_SESSION_STATUS } from '@/types/wheel';

const session = {
  id: 'r1',
  wheelId: 'pizza',
  wheelName: 'Pizza Night',
  status: SPIN_SESSION_STATUS.completed,
  results: [
    {
      id: 'r1',
      sessionId: 'session-1',
      wheelId: 'pizza',
      itemId: 'large',
      itemName: 'Large',
      selectedItemId: 'large',
      selectedItemName: 'Large',
      parentItemId: 'chicken-pepperoni',
      path: ['pizza', 'chicken-pepperoni', 'large'],
      pathLabels: ['Pizza', 'Chicken Pepperoni', 'Large'],
      depth: 2,
      probability: 1,
      timestamp: '2026-01-04T00:00:00.000Z',
      spunAt: '2026-01-04T00:00:00.000Z',
      duration: 4000,
      mode: SELECTION_MODE.manual,
    },
  ],
  path: ['pizza', 'chicken-pepperoni', 'large'],
  startedAt: '2026-01-04T00:00:00.000Z',
  completedAt: '2026-01-04T00:00:00.000Z',
} as const;

describe('historyStore', () => {
  beforeEach(() => {
    resetHistoryStore();
  });

  it('adds, deletes, and clears saved spin results', () => {
    useHistoryStore.getState().addSpinSession(session);
    expect(useHistoryStore.getState().spinHistory).toHaveLength(1);

    useHistoryStore.getState().deleteSpinSession('r1');
    expect(useHistoryStore.getState().spinHistory).toEqual([]);

    useHistoryStore.getState().addSpinSession(session);
    useHistoryStore.getState().clearSpinHistory();
    expect(useHistoryStore.getState().spinHistory).toEqual([]);
  });
});
