import {
  childItemsOf,
  completedSelectionPath,
  selectionPathIds,
  selectionPathNames,
  toSelectionStep,
} from '@/features/spin/utils/selectionPath';
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

describe('selectionPath', () => {
  const pizza = item('Pizza', {
    icon: '🍕',
    children: [item('Chicken Pepperoni'), item('Beef Pepperoni')],
  });

  it('maps a winner to a path step without copying children', () => {
    expect(toSelectionStep(pizza)).toEqual({ id: 'pizza', name: 'Pizza', icon: '🍕' });
  });

  it('copies child items so the parent list is not shared', () => {
    const children = childItemsOf(pizza);

    expect(children?.map((entry) => entry.name)).toEqual(['Chicken Pepperoni', 'Beef Pepperoni']);
    expect(children).not.toBe(pizza.children);
    expect(childItemsOf(item('Burger'))).toBeUndefined();
  });

  it('builds the completed path as ancestor names plus the winner', () => {
    const path = completedSelectionPath([toSelectionStep(pizza)], item('Chicken Pepperoni'));

    expect(selectionPathNames(path)).toEqual(['Pizza', 'Chicken Pepperoni']);
    expect(selectionPathIds(path)).toEqual(['pizza', 'chicken-pepperoni']);
  });
});
