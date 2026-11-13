import {
  AUTO_SELECTION_MAX_STEPS,
  advanceSelectionLevel,
  canAutoAdvanceSelection,
  canContinueSelection,
  createHierarchicalSelectionResult,
  eligibleChildItems,
  eligibleRootItems,
  hasSelectionCycle,
  SELECTION_DECISION,
  selectionAfterWinner,
  selectionDecision,
  selectionPathWithItem,
  shouldAutoAdvanceSelection,
} from '@/features/spin/utils/selectionFlow';
import { toSelectionStep, type SelectionStep } from '@/features/spin/utils/selectionPath';
import { SELECTION_MODE } from '@/types/wheel';
import type { WheelItem } from '@/types/wheel';
import * as idUtils from '@/utils/id';
import {
  createMaxWinsCondition,
  createRequiresSelectedItemCondition,
} from '@/utils/itemConditions';

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
      durationMs: 0,
    });
  });

  it('blocks automatic advance on a cycle or safety cap', () => {
    expect(shouldAutoAdvanceSelection(SELECTION_MODE.manual, [], pizza)).toBe(false);
    expect(shouldAutoAdvanceSelection(SELECTION_MODE.ask, [], pizza)).toBe(false);
    expect(shouldAutoAdvanceSelection(SELECTION_MODE.automatic, [], pizza)).toBe(true);
    expect(canAutoAdvanceSelection([toSelectionStep(pizza)], pizza)).toBe(false);
    expect(canAutoAdvanceSelection([], thinCrust)).toBe(false);

    const capped = Array.from({ length: AUTO_SELECTION_MAX_STEPS }, (_, index) =>
      toSelectionStep(item(`Level ${index}`)),
    );
    expect(canAutoAdvanceSelection(capped, pizza)).toBe(false);
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

  it('filters child options by conditions for the selected parent path', () => {
    const cardNumber = nested('Card Number');
    const bank = nested('Bank');
    const wallet = nested('Wallet Provider');
    const payment = nested('Payment', [
      nested('Credit Card', [cardNumber, bank, wallet]),
      nested('FPX', [cardNumber, bank, wallet]),
      nested('E-Wallet', [cardNumber, bank, wallet]),
    ]);

    const conditions = [
      createRequiresSelectedItemCondition('card-number', 'credit-card', 'c1'),
      createRequiresSelectedItemCondition('bank', 'fpx', 'c2'),
      createRequiresSelectedItemCondition('wallet-provider', 'e-wallet', 'c3'),
    ];

    const afterCreditCard = advanceSelectionLevel(
      [toSelectionStep(payment)],
      nested('Credit Card', [cardNumber, bank, wallet]),
      { conditions },
    );
    expect(afterCreditCard?.items.map((entry) => entry.name)).toEqual(['Card Number']);

    const afterFpx = advanceSelectionLevel(
      [toSelectionStep(payment)],
      nested('FPX', [cardNumber, bank, wallet]),
      { conditions },
    );
    expect(afterFpx?.items.map((entry) => entry.name)).toEqual(['Bank']);
  });

  it('finishes when all children are ruled out by conditions', () => {
    const parent = nested('Parent', [nested('Gated Child')]);
    const conditions = [createRequiresSelectedItemCondition('gated-child', 'missing', 'c1')];

    expect(canContinueSelection(parent, { conditions, ancestorIds: [] })).toBe(false);
    expect(advanceSelectionLevel([], parent, { conditions })).toBeUndefined();
    expect(shouldAutoAdvanceSelection(SELECTION_MODE.automatic, [], parent, { conditions })).toBe(
      false,
    );
  });

  it('filters root items and respects max-wins win counts', () => {
    const roots = [item('Open'), item('Limited', { weight: 2 })];
    const conditions = [createMaxWinsCondition('limited', 1, 'max-1')];

    expect(eligibleRootItems(roots, { conditions }).map((entry) => entry.name)).toEqual([
      'Open',
      'Limited',
    ]);
    expect(
      eligibleRootItems(roots, {
        conditions,
        winCounts: { limited: 1 },
      }).map((entry) => entry.name),
    ).toEqual(['Open']);
  });

  it('builds a selection path that appends the current item id', () => {
    expect(selectionPathWithItem([], pizza.id)).toEqual(['pizza']);
    expect(selectionPathWithItem([toSelectionStep(pizza), toSelectionStep(chicken)], large.id)).toEqual([
      'pizza',
      'chicken-pepperoni',
      'large',
    ]);
  });

  it('returns eligible children and treats empty filtered sets as terminal', () => {
    expect(eligibleChildItems(thinCrust)).toBeUndefined();
    expect(eligibleChildItems(pizza)?.map((entry) => entry.name)).toEqual([
      'Chicken Pepperoni',
      'Beef Pepperoni',
    ]);

    const gated = nested('Parent', [nested('Gated Child')]);
    expect(
      eligibleChildItems(gated, {
        conditions: [createRequiresSelectedItemCondition('gated-child', 'missing', 'c1')],
      }),
    ).toBeUndefined();
  });

  it('continues when win counts leave at least one child eligible', () => {
    const open = nested('Open Child');
    const limited = nested('Limited Child');
    const parent = nested('Parent', [open, limited]);
    const options = {
      conditions: [createMaxWinsCondition('limited-child', 1, 'max-1')],
      winCounts: { 'limited-child': 1 },
    };

    expect(selectionDecision(parent, options)).toBe(SELECTION_DECISION.continue);
    expect(eligibleChildItems(parent, options)?.map((entry) => entry.name)).toEqual(['Open Child']);
    expect(selectionDecision(parent, { winCounts: { 'limited-child': 0 } })).toBe(
      SELECTION_DECISION.continue,
    );
  });

  it('detects selection cycles by winner id', () => {
    expect(hasSelectionCycle([], pizza.id)).toBe(false);
    expect(hasSelectionCycle([toSelectionStep(pizza)], chicken.id)).toBe(false);
    expect(hasSelectionCycle([toSelectionStep(pizza), toSelectionStep(chicken)], pizza.id)).toBe(
      true,
    );
  });

  it('appends the winner onto the ancestor path', () => {
    const ancestors = [toSelectionStep(pizza)];
    expect(selectionAfterWinner(ancestors)).toEqual(ancestors);
    expect(selectionAfterWinner(ancestors, chicken)).toEqual([
      toSelectionStep(pizza),
      toSelectionStep(chicken),
    ]);
  });

  it('defaults timestamp and duration when creating a result', () => {
    const now = vi.spyOn(idUtils, 'nowIso').mockReturnValue('2026-11-13T00:00:00.000Z');
    const selection = [toSelectionStep(pizza)];

    expect(
      createHierarchicalSelectionResult({
        sessionId: 'session-2',
        wheelId: 'pizza-night',
        selection,
      }),
    ).toEqual({
      sessionId: 'session-2',
      wheelId: 'pizza-night',
      selectedItemId: 'pizza',
      path: ['pizza'],
      labels: ['Pizza'],
      timestamp: '2026-11-13T00:00:00.000Z',
      durationMs: 0,
    });

    expect(
      createHierarchicalSelectionResult({
        sessionId: 'session-2',
        wheelId: 'pizza-night',
        selection,
        durationMs: 1250,
        timestamp: '2026-11-13T01:00:00.000Z',
      })?.durationMs,
    ).toBe(1250);

    now.mockRestore();
  });
});
