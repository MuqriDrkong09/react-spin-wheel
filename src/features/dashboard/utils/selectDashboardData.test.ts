import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import {
  CATEGORY_FILTER_ALL,
  WHEEL_SORT,
} from '@/features/dashboard/constants';
import {
  getCategoryOptions,
  getWheelCategory,
  selectDashboardStats,
  selectFavoriteWheels,
  selectFilteredWheels,
  selectRecentResults,
  selectRecentlyUsedWheels,
} from '@/features/dashboard/utils/selectDashboardData';
import { SPIN_SESSION_STATUS, type SpinSession, type Wheel } from '@/types/wheel';

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
        parentItemId: null,
        path: ['dishes'],
        depth: 0,
        probability: 1,
        spunAt: '2026-01-05T00:00:00.000Z',
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
        parentItemId: null,
        path: ['pepperoni'],
        depth: 0,
        probability: 1,
        spunAt: '2026-01-04T00:00:00.000Z',
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
  it('defaults missing categories to General', () => {
    expect(getWheelCategory(createWheel({ id: 'plain', name: 'Plain', category: undefined }))).toBe(
      'General',
    );
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
    expect(selectDashboardStats([pizza, chores], history, ['pizza', 'missing'])).toEqual({
      totalWheels: 2,
      totalSpins: 3,
      totalWinners: 2,
      favoriteCount: 1,
    });
  });

  it('filters and sorts wheels', () => {
    const wheels = [pizza, chores, games];

    expect(
      selectFilteredWheels(wheels, history, 'pizza', CATEGORY_FILTER_ALL, WHEEL_SORT.nameAsc).map(
        (wheel) => wheel.id,
      ),
    ).toEqual(['pizza']);

    expect(
      selectFilteredWheels(wheels, history, '', 'Food', WHEEL_SORT.nameAsc).map((wheel) => wheel.id),
    ).toEqual(['pizza']);

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
  });

  it('selects favorite wheels in stored order', () => {
    expect(selectFavoriteWheels([pizza, chores, games], ['games', 'missing', 'pizza']).map((wheel) => wheel.id)).toEqual(
      ['games', 'pizza'],
    );
  });

  it('selects recently used wheels without duplicates or missing wheels', () => {
    expect(selectRecentlyUsedWheels([pizza, chores], history)).toEqual([
      { wheel: chores, lastUsedAt: '2026-01-05T00:00:00.000Z' },
      { wheel: pizza, lastUsedAt: '2026-01-04T00:00:00.000Z' },
    ]);
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
});
