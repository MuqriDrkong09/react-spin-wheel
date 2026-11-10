import { excludeRemovedWinners, withRemovedWinner } from '@/features/spin/utils/removeWinner';
import type { WheelItem } from '@/types/wheel';

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

describe('excludeRemovedWinners', () => {
  const thinCrust = item('Thin Crust');
  const thickCrust = item('Thick Crust');
  const large = item('Large', { children: [thinCrust, thickCrust] });
  const chicken = item('Chicken Pepperoni', { children: [large] });
  const beef = item('Beef Pepperoni');
  const pizza = item('Pizza', { children: [chicken, beef] });
  const burger = item('Burger');
  const items = [pizza, burger];

  it('returns the same list when nothing is removed', () => {
    expect(excludeRemovedWinners(items, new Set())).toBe(items);
  });

  it('removes Pizza without deleting or promoting its children', () => {
    const next = excludeRemovedWinners(items, new Set(['pizza']));

    expect(next.map((entry) => entry.name)).toEqual(['Burger']);
    expect(next[0]).toBe(burger);
    expect(pizza.children).toEqual([chicken, beef]);
  });

  it('removes only Chicken Pepperoni from Pizza.children', () => {
    const next = excludeRemovedWinners(items, new Set(['chicken-pepperoni']));
    const nextPizza = next[0];

    expect(next[1]).toBe(burger);
    expect(nextPizza?.name).toBe('Pizza');
    expect(nextPizza?.children?.map((entry) => entry.name)).toEqual(['Beef Pepperoni']);
    expect(nextPizza?.children?.[0]).toBe(beef);
    expect(pizza.children).toEqual([chicken, beef]);
    expect(chicken.children).toEqual([large]);
  });

  it('removes a nested winner at any depth and keeps its siblings', () => {
    const next = excludeRemovedWinners(items, new Set(['large']));
    const nextChicken = next[0]?.children?.[0];

    expect(next[0]?.name).toBe('Pizza');
    expect(next[0]?.children?.map((entry) => entry.name)).toEqual([
      'Chicken Pepperoni',
      'Beef Pepperoni',
    ]);
    expect(nextChicken?.children).toEqual([]);
    expect(large.children).toEqual([thinCrust, thickCrust]);
  });

  it('returns the same reference when no removed ids match', () => {
    expect(excludeRemovedWinners(items, new Set(['ghost', 'missing']))).toBe(items);
  });

  it('removes multiple winners in one pass without promoting children', () => {
    const next = excludeRemovedWinners(items, new Set(['chicken-pepperoni', 'burger']));

    expect(next.map((entry) => entry.name)).toEqual(['Pizza']);
    expect(next[0]?.children?.map((entry) => entry.name)).toEqual(['Beef Pepperoni']);
    expect(next[0]?.children?.[0]).toBe(beef);
    expect(pizza.children).toEqual([chicken, beef]);
  });

  it('keeps a parent with an empty children list when every child is removed', () => {
    const next = excludeRemovedWinners(items, new Set(['thin-crust', 'thick-crust']));
    const nextLarge = next[0]?.children?.[0]?.children?.[0];

    expect(nextLarge?.name).toBe('Large');
    expect(nextLarge?.children).toEqual([]);
    expect(large.children).toEqual([thinCrust, thickCrust]);
  });
});

describe('withRemovedWinner', () => {
  it('appends a new winner id once', () => {
    expect(withRemovedWinner(['pizza'], 'chicken-pepperoni')).toEqual([
      'pizza',
      'chicken-pepperoni',
    ]);
    expect(withRemovedWinner(['pizza'], 'pizza')).toEqual(['pizza']);
  });
});
