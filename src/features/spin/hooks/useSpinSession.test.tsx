import { act, renderHook } from '@testing-library/react';

import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { useSpinSession } from '@/features/spin/hooks/useSpinSession';
import { AUTO_SELECTION_MAX_STEPS } from '@/features/spin/utils/selectionFlow';
import { SELECTION_MODE, type Wheel, type WheelItem } from '@/types/wheel';

function item(name: string, extra?: Partial<WheelItem>): WheelItem {
  return {
    id: name.toLowerCase().replaceAll(' ', '-'),
    name,
    color: '#ea580c',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function foodWheel(): Wheel {
  return {
    id: 'food',
    name: 'Food Wheel',
    items: [
      item('Pizza', {
        children: [item('Chicken Pepperoni'), item('Beef Pepperoni')],
      }),
      item('Burger'),
    ],
    settings: { ...DEFAULT_WHEEL_SETTINGS, durationMs: 1, minRotations: 1, maxRotations: 1 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function pizzaNightWheel(): Wheel {
  return {
    id: 'pizza-night',
    name: 'Pizza Night',
    items: [
      item('Pizza', {
        children: [
          item('Chicken Pepperoni', {
            children: [
              item('Large', {
                children: [item('Thin Crust'), item('Thick Crust')],
              }),
              item('Medium'),
            ],
          }),
          item('Beef Pepperoni'),
        ],
      }),
    ],
    settings: { ...DEFAULT_WHEEL_SETTINGS, durationMs: 1, minRotations: 1, maxRotations: 1 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function spinNextLevel(
  result: { current: ReturnType<typeof useSpinSession> },
  expectedName: string,
) {
  act(() => {
    result.current.startSpin();
  });
  expect(result.current.winner?.name).toBe(expectedName);

  if (result.current.canContinue) {
    act(() => {
      result.current.spinChild();
    });
  }
}

describe('useSpinSession', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('tracks the name path through a child spin without mutating the parent items', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const wheel = foodWheel();
    const parentItems = wheel.items;
    const { result } = renderHook(() => useSpinSession(wheel));

    act(() => {
      result.current.startSpin();
    });
    expect(result.current.path).toEqual(['Pizza']);
    expect(result.current.canContinue).toBe(true);
    expect(result.current.result).toBeUndefined();

    act(() => {
      result.current.spinChild();
    });

    expect(result.current.items.map((entry) => entry.name)).toEqual([
      'Chicken Pepperoni',
      'Beef Pepperoni',
    ]);
    expect(result.current.path).toEqual(['Pizza']);
    expect(result.current.winnerOpen).toBe(false);
    expect(wheel.items).toBe(parentItems);
    expect(parentItems[0]?.children).toHaveLength(2);

    act(() => {
      result.current.startSpin();
    });

    expect(result.current.path).toEqual(['Pizza', 'Chicken Pepperoni']);
    expect(result.current.winner?.name).toBe('Chicken Pepperoni');
    expect(result.current.canContinue).toBe(false);
    expect(wheel.items[0]?.name).toBe('Pizza');
    expect(wheel.items[0]?.children?.[0]?.name).toBe('Chicken Pepperoni');
  });

  it('spins parent, child, and grandchildren then finishes with a complete result', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const wheel = pizzaNightWheel();
    const parentItems = wheel.items;
    const { result } = renderHook(() => useSpinSession(wheel));

    spinNextLevel(result, 'Pizza');
    spinNextLevel(result, 'Chicken Pepperoni');
    spinNextLevel(result, 'Large');
    act(() => {
      result.current.startSpin();
    });

    expect(result.current.path).toEqual(['Pizza', 'Chicken Pepperoni', 'Large', 'Thin Crust']);
    expect(result.current.canContinue).toBe(false);
    expect(result.current.result).toEqual({
      sessionId: result.current.sessionId,
      wheelId: 'pizza-night',
      selectedItemId: 'thin-crust',
      path: ['pizza', 'chicken-pepperoni', 'large', 'thin-crust'],
      labels: ['Pizza', 'Chicken Pepperoni', 'Large', 'Thin Crust'],
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    expect(wheel.items).toBe(parentItems);
    expect(wheel.items[0]?.children?.[0]?.children?.[0]?.children?.[0]?.name).toBe('Thin Crust');
  });

  it('finishes early on a parent that still has children', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { result } = renderHook(() => useSpinSession(pizzaNightWheel()));

    act(() => {
      result.current.startSpin();
    });

    act(() => {
      result.current.finish();
    });

    expect(result.current.result).toEqual({
      sessionId: result.current.sessionId,
      wheelId: 'pizza-night',
      selectedItemId: 'pizza',
      path: ['pizza'],
      labels: ['Pizza'],
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    expect(result.current.canContinue).toBe(true);
  });

  it('automatically continues through nested children until a leaf', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const wheel = pizzaNightWheel();
    wheel.settings.selectionMode = SELECTION_MODE.automatic;
    const { result } = renderHook(() => useSpinSession(wheel));

    act(() => {
      result.current.startSpin();
    });

    expect(result.current.path).toEqual(['Pizza', 'Chicken Pepperoni', 'Large', 'Thin Crust']);
    expect(result.current.canContinue).toBe(false);
    expect(result.current.winnerOpen).toBe(true);
    expect(result.current.winner?.name).toBe('Thin Crust');
  });

  it('stops automatic spinning when an item would repeat', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const child = item('Child');
    const parent = item('Parent', { children: [child] });
    child.children = [parent];
    const wheel: Wheel = {
      id: 'cycle',
      name: 'Cycle',
      items: [parent],
      settings: {
        ...DEFAULT_WHEEL_SETTINGS,
        durationMs: 1,
        minRotations: 1,
        maxRotations: 1,
        selectionMode: SELECTION_MODE.automatic,
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const { result } = renderHook(() => useSpinSession(wheel));

    act(() => {
      result.current.startSpin();
    });

    expect(result.current.path.length).toBeLessThanOrEqual(AUTO_SELECTION_MAX_STEPS + 1);
    expect(result.current.path).toEqual(['Parent', 'Child', 'Parent']);
    expect(result.current.winnerOpen).toBe(true);
    expect(result.current.spin.status).not.toBe('spinning');
  });

  it('parks on the child wheel before automatic spinning when motion is allowed', async () => {
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const wheel = foodWheel();
    wheel.settings.selectionMode = SELECTION_MODE.automatic;
    const { result } = renderHook(() => useSpinSession(wheel));

    act(() => {
      result.current.startSpin();
    });
    expect(result.current.spin.spinning).toBe(true);
    expect(result.current.winnerOpen).toBe(false);

    act(() => {
      result.current.completeSpin();
    });

    expect(result.current.items.map((entry) => entry.name)).toEqual([
      'Chicken Pepperoni',
      'Beef Pepperoni',
    ]);
    expect(result.current.spin.status).toBe('idle');
    expect(result.current.winnerOpen).toBe(false);
    expect(result.current.path).toEqual(['Pizza']);

    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
    });

    expect(result.current.spin.spinning).toBe(true);
    expect(result.current.winnerOpen).toBe(false);
    expect(result.current.items.map((entry) => entry.name)).toEqual([
      'Chicken Pepperoni',
      'Beef Pepperoni',
    ]);
  });
});
