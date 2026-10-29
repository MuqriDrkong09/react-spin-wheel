import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import {
  CATEGORY_FILTER_ALL,
  DASHBOARD_LIST_LIMIT,
  WHEEL_SORT,
} from '@/features/dashboard/constants';
import {
  getCategoryOptions,
  getLastUsedAt,
  getWheelCategory,
  selectDashboardStats,
  selectFavoriteWheels,
  selectFilteredWheels,
  selectRecentResults,
  selectRecentlyUsedWheels,
} from '@/features/dashboard/utils/selectDashboardData';
import { SPIN_SESSION_STATUS, type SpinResult, type SpinSession, type Wheel } from '@/types/wheel';

function createWheel(overrides: Partial<Wheel> & Pick<Wheel, 'id' | 'name'>): Wheel {
  return {
    description: undefined,
    category: 'General',
    items: [],
    settings: DEFAULT_WHEEL_SETTINGS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createResult(
  overrides: Partial<SpinResult> & Pick<SpinResult, 'id' | 'sessionId' | 'wheelId' | 'itemName'>,
): SpinResult {
  return {
    itemId: overrides.itemName.toLowerCase(),
    selectedItemId: overrides.itemName.toLowerCase(),
    selectedItemName: overrides.itemName,
    parentItemId: null,
    path: [overrides.itemName.toLowerCase()],
    pathLabels: [overrides.itemName],
    depth: 0,
    probability: 1,
    timestamp: '2026-01-02T00:00:00.000Z',
    spunAt: '2026-01-02T00:00:00.000Z',
    duration: 800,
    mode: 'manual',
    ...overrides,
  };
}

function createSession(
  overrides: Partial<SpinSession> & Pick<SpinSession, 'id' | 'wheelId' | 'wheelName'>,
): SpinSession {
  return {
    status: SPIN_SESSION_STATUS.completed,
    results: [],
    path: [],
    startedAt: '2026-01-02T00:00:00.000Z',
    completedAt: '2026-01-02T00:00:01.000Z',
    ...overrides,
  };
}

const pizza = createWheel({
  id: 'pizza',
  name: 'Pizza Night',
  description: 'Weekend dinner',
  category: 'Food',
  updatedAt: '2026-01-03T00:00:00.000Z',
});

const chores = createWheel({
  id: 'chores',
  name: 'Chores',
  category: 'Decisions',
  updatedAt: '2026-01-04T00:00:00.000Z',
});

const games = createWheel({
  id: 'games',
  name: 'Game Night',
  category: 'Games',
  updatedAt: '2026-01-02T00:00:00.000Z',
});

const history: SpinSession[] = [
  createSession({
    id: 's2',
    wheelId: 'chores',
    wheelName: 'Chores',
    startedAt: '2026-01-05T00:00:00.000Z',
    results: [
      {
        id: 'r2',
        sessionId: 's2',
        wheelId: 'chores',
        itemId: 'dishes',
        itemName: 'Dishes',
        selectedItemId: 'dishes',
        selectedItemName: 'Dishes',
        parentItemId: null,
        path: ['dishes'],
        pathLabels: ['Dishes'],
        depth: 0,
        probability: 1,
        timestamp: '2026-01-05T00:00:00.000Z',
        spunAt: '2026-01-05T00:00:00.000Z',
        duration: 800,
        mode: 'manual',
      },
    ],
  }),
  createSession({
    id: 's1',
    wheelId: 'pizza',
    wheelName: 'Pizza Night',
    startedAt: '2026-01-04T00:00:00.000Z',
    results: [
      {
        id: 'r1',
        sessionId: 's1',
        wheelId: 'pizza',
        itemId: 'pepperoni',
        itemName: 'Pepperoni',
        selectedItemId: 'pepperoni',
        selectedItemName: 'Pepperoni',
        parentItemId: null,
        path: ['pepperoni'],
        pathLabels: ['Pepperoni'],
        depth: 0,
        probability: 1,
        timestamp: '2026-01-04T00:00:00.000Z',
        spunAt: '2026-01-04T00:00:00.000Z',
        duration: 1500,
        mode: 'ask',
      },
    ],
  }),
  createSession({
    id: 's0',
    wheelId: 'missing',
    wheelName: 'Deleted',
    status: SPIN_SESSION_STATUS.cancelled,
  }),
];

describe('selectDashboardData', () => {
  it('defaults missing and blank categories to General', () => {
    expect(getWheelCategory(createWheel({ id: 'plain', name: 'Plain', category: undefined }))).toBe(
      'General',
    );
    expect(getWheelCategory(createWheel({ id: 'blank', name: 'Blank', category: '   ' }))).toBe(
      'General',
    );
  });

  it('returns the latest session start time for a wheel', () => {
    expect(getLastUsedAt('pizza', history)).toBe('2026-01-04T00:00:00.000Z');
    expect(getLastUsedAt('games', history)).toBeUndefined();
  });

  it('builds category options with all, defaults, and custom values', () => {
    const options = getCategoryOptions([
      pizza,
      createWheel({ id: 'team', name: 'Team', category: 'Work' }),
    ]);

    expect(options[0]).toBe(CATEGORY_FILTER_ALL);
    expect(options).toContain('Food');
    expect(options).toContain('Work');
  });

  it('computes dashboard stats', () => {
    const emptyCompleted = createSession({
      id: 'empty',
      wheelId: 'pizza',
      wheelName: 'Pizza Night',
      status: SPIN_SESSION_STATUS.completed,
      results: [],
    });

    expect(selectDashboardStats([pizza, chores], [...history, emptyCompleted], ['pizza', 'missing'])).toEqual({
      totalWheels: 2,
      totalSpins: 4,
      totalWinners: 2,
      favoriteCount: 1,
    });
  });

  it('filters and sorts wheels', () => {
    const wheels = [pizza, chores, games];

    expect(
      selectFilteredWheels(wheels, history, '  pizza  ', CATEGORY_FILTER_ALL, WHEEL_SORT.nameAsc).map(
        (wheel) => wheel.id,
      ),
    ).toEqual(['pizza']);

    expect(
      selectFilteredWheels(wheels, history, 'weekend', CATEGORY_FILTER_ALL, WHEEL_SORT.nameAsc).map(
        (wheel) => wheel.id,
      ),
    ).toEqual(['pizza']);

    expect(
      selectFilteredWheels(wheels, history, '', 'Food', WHEEL_SORT.nameAsc).map((wheel) => wheel.id),
    ).toEqual(['pizza']);

    expect(
      selectFilteredWheels(wheels, history, '', CATEGORY_FILTER_ALL, WHEEL_SORT.nameAsc).map(
        (wheel) => wheel.id,
      ),
    ).toEqual(['chores', 'games', 'pizza']);

    expect(
      selectFilteredWheels(wheels, history, '', CATEGORY_FILTER_ALL, WHEEL_SORT.nameDesc).map(
        (wheel) => wheel.id,
      ),
    ).toEqual(['pizza', 'games', 'chores']);

    expect(
      selectFilteredWheels(wheels, history, '', CATEGORY_FILTER_ALL, WHEEL_SORT.updatedDesc).map(
        (wheel) => wheel.id,
      ),
    ).toEqual(['chores', 'pizza', 'games']);

    expect(
      selectFilteredWheels(wheels, history, '', CATEGORY_FILTER_ALL, WHEEL_SORT.usedDesc).map(
        (wheel) => wheel.id,
      ),
    ).toEqual(['chores', 'pizza', 'games']);

    const unusedNewer = createWheel({
      id: 'newer',
      name: 'Newer',
      updatedAt: '2026-01-10T00:00:00.000Z',
    });
    expect(
      selectFilteredWheels([games, unusedNewer], [], '', CATEGORY_FILTER_ALL, WHEEL_SORT.usedDesc).map(
        (wheel) => wheel.id,
      ),
    ).toEqual(['newer', 'games']);
  });

  it('selects favorite wheels in stored order and caps the list', () => {
    expect(selectFavoriteWheels([pizza, chores, games], ['games', 'missing', 'pizza']).map((wheel) => wheel.id)).toEqual(
      ['games', 'pizza'],
    );

    const extras = Array.from({ length: DASHBOARD_LIST_LIMIT + 1 }, (_, index) =>
      createWheel({ id: `fav-${index}`, name: `Favorite ${index}` }),
    );

    expect(
      selectFavoriteWheels(
        extras,
        extras.map((wheel) => wheel.id),
      ),
    ).toHaveLength(DASHBOARD_LIST_LIMIT);
  });

  it('selects recently used wheels without duplicates or missing wheels', () => {
    const duplicateChores = createSession({
      id: 's2-again',
      wheelId: 'chores',
      wheelName: 'Chores',
      startedAt: '2026-01-06T00:00:00.000Z',
    });

    expect(selectRecentlyUsedWheels([pizza, chores], [duplicateChores, ...history])).toEqual([
      { wheel: chores, lastUsedAt: '2026-01-06T00:00:00.000Z' },
      { wheel: pizza, lastUsedAt: '2026-01-04T00:00:00.000Z' },
    ]);
  });

  it('caps recently used wheels at the dashboard list limit', () => {
    const extras = Array.from({ length: DASHBOARD_LIST_LIMIT + 1 }, (_, index) =>
      createWheel({ id: `used-${index}`, name: `Used ${index}` }),
    );
    const sessions = extras.map((wheel, index) =>
      createSession({
        id: `used-session-${index}`,
        wheelId: wheel.id,
        wheelName: wheel.name,
        startedAt: `2026-01-0${index + 1}T00:00:00.000Z`,
      }),
    );

    expect(selectRecentlyUsedWheels(extras, sessions)).toHaveLength(DASHBOARD_LIST_LIMIT);
  });

  it('selects recent results from the latest winner in each session', () => {
    expect(selectRecentResults(history)).toEqual([
      {
        id: 'r2',
        wheelId: 'chores',
        wheelName: 'Chores',
        itemName: 'Dishes',
        spunAt: '2026-01-05T00:00:00.000Z',
      },
      {
        id: 'r1',
        wheelId: 'pizza',
        wheelName: 'Pizza Night',
        itemName: 'Pepperoni',
        spunAt: '2026-01-04T00:00:00.000Z',
      },
    ]);
  });

  it('uses the last winner in a session and caps recent results', () => {
    const multiWinner = createSession({
      id: 's-multi',
      wheelId: 'pizza',
      wheelName: 'Pizza Night',
      results: [
        createResult({ id: 'first', sessionId: 's-multi', wheelId: 'pizza', itemName: 'Pepperoni' }),
        createResult({
          id: 'last',
          sessionId: 's-multi',
          wheelId: 'pizza',
          itemName: 'Margherita',
          spunAt: '2026-01-07T00:00:00.000Z',
        }),
      ],
    });

    expect(selectRecentResults([multiWinner])[0]).toMatchObject({
      id: 'last',
      itemName: 'Margherita',
    });

    const sessions = Array.from({ length: DASHBOARD_LIST_LIMIT + 1 }, (_, index) =>
      createSession({
        id: `result-${index}`,
        wheelId: 'pizza',
        wheelName: 'Pizza Night',
        results: [
          createResult({
            id: `winner-${index}`,
            sessionId: `result-${index}`,
            wheelId: 'pizza',
            itemName: `Winner ${index}`,
          }),
        ],
      }),
    );

    expect(selectRecentResults(sessions)).toHaveLength(DASHBOARD_LIST_LIMIT);
  });
});
