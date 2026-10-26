import { act, renderHook } from '@testing-library/react';

import { useSpinSession } from '@/features/spin/hooks/useSpinSession';
import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import type { Wheel } from '@/types/wheel';

function foodWheel(): Wheel {
  return {
    id: 'food',
    name: 'Food Wheel',
    items: [
      {
        id: 'pizza',
        name: 'Pizza',
        color: '#ea580c',
        enabled: true,
        weight: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        children: [
          {
            id: 'pepperoni',
            name: 'Chicken Pepperoni',
            color: '#dc2626',
            enabled: true,
            weight: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'beef',
            name: 'Beef Pepperoni',
            color: '#ca8a04',
            enabled: true,
            weight: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      {
        id: 'burger',
        name: 'Burger',
        color: '#ca8a04',
        enabled: true,
        weight: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    settings: { ...DEFAULT_WHEEL_SETTINGS, durationMs: 1, minRotations: 1, maxRotations: 1 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
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

    act(() => {
      result.current.spinChild();
    });

    expect(result.current.items.map((item) => item.name)).toEqual([
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
    expect(wheel.items[0]?.name).toBe('Pizza');
    expect(wheel.items[0]?.children?.[0]?.name).toBe('Chicken Pepperoni');
  });
});
