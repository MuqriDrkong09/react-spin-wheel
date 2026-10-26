import {
  advanceSelectionLevel,
  canContinueSelection,
  createHierarchicalSelectionResult,
  SELECTION_DECISION,
  selectionDecision,
} from '@/features/spin/utils/selectionFlow';
import { toSelectionStep, type SelectionStep } from '@/features/spin/utils/selectionPath';
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

function nested(name: string, children?: WheelItem[]): WheelItem {
  return item(name, children ? { children } : undefined);
}

const thinCrust = nested('Thin Crust');
const thickCrust = nested('Thick Crust');
const large = nested('Large', [thinCrust, thickCrust]);
const chicken = nested('Chicken Pepperoni', [large, nested('Medium')]);
const pizza = nested('Pizza', [chicken, nested('Beef Pepperoni')]);

describe('selectionFlow', () => {
  it('continues while children exist and finishes on a leaf', () => {
    expect(selectionDecision(pizza)).toBe(SELECTION_DECISION.continue);
    expect(selectionDecision(chicken)).toBe(SELECTION_DECISION.continue);
    expect(selectionDecision(large)).toBe(SELECTION_DECISION.continue);
    expect(selectionDecision(thinCrust)).toBe(SELECTION_DECISION.finish);
    expect(canContinueSelection(thinCrust)).toBe(false);
  });

  it('advances through parent, child, and grandchild without a depth limit', () => {
    const afterPizza = advanceSelectionLevel([], pizza);
    expect(afterPizza?.items.map((entry) => entry.name)).toEqual([
      'Chicken Pepperoni',
      'Beef Pepperoni',
    ]);
    expect(afterPizza?.items).not.toBe(pizza.children);

    const afterChicken = advanceSelectionLevel(afterPizza?.ancestors ?? [], chicken);
    expect(afterChicken?.items.map((entry) => entry.name)).toEqual(['Large', 'Medium']);

    const afterLarge = advanceSelectionLevel(afterChicken?.ancestors ?? [], large);
    expect(afterLarge?.ancestors.map((step) => step.name)).toEqual([
      'Pizza',
      'Chicken Pepperoni',
      'Large',
    ]);
    expect(afterLarge?.items.map((entry) => entry.name)).toEqual(['Thin Crust', 'Thick Crust']);
    expect(advanceSelectionLevel(afterLarge?.ancestors ?? [], thinCrust)).toBeUndefined();
  });

  it('walks an arbitrarily deep tree without a max depth', () => {
    let current: WheelItem = item('Leaf');
    for (let depth = 1; depth <= 12; depth += 1) {
      current = item(`Level ${depth}`, { children: [current] });
    }

    let ancestors: SelectionStep[] = [];
    let winner: WheelItem = current;
    let steps = 0;

    while (canContinueSelection(winner)) {
      const next = advanceSelectionLevel(ancestors, winner);
      const child = next?.items[0];
      expect(next).toBeDefined();
      expect(child).toBeDefined();
      if (!next || !child) {
        break;
      }
      ancestors = next.ancestors;
      winner = child;
      steps += 1;
    }

    expect(steps).toBe(12);
    expect(winner.name).toBe('Leaf');
    expect(ancestors).toHaveLength(12);
  });

  it('builds the completed selection result from the full path', () => {
    const selection = [pizza, chicken, large, thinCrust].map((entry) => toSelectionStep(entry));
    const result = createHierarchicalSelectionResult({
      sessionId: 'session-1',
      wheelId: 'pizza-night',
      selection,
      timestamp: '2026-10-26T04:00:00.000Z',
    });

    expect(result).toEqual({
      sessionId: 'session-1',
      wheelId: 'pizza-night',
      selectedItemId: 'thin-crust',
      path: ['pizza', 'chicken-pepperoni', 'large', 'thin-crust'],
      labels: ['Pizza', 'Chicken Pepperoni', 'Large', 'Thin Crust'],
      timestamp: '2026-10-26T04:00:00.000Z',
    });
  });

  it('does not create a result without a selected item', () => {
    expect(
      createHierarchicalSelectionResult({
        sessionId: 'session-1',
        wheelId: 'pizza-night',
        selection: [],
      }),
    ).toBeUndefined();
  });
});
