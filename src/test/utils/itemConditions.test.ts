import { ITEM_CONDITION_KIND, type ItemCondition, type WheelItem } from '@/types/wheel';
import {
  createAlwaysCondition,
  createMaxWinsCondition,
  createMinWeightCondition,
  createRequiresAnySelectedItemCondition,
  createRequiresSelectedItemCondition,
  evaluateItemCondition,
  filterItemsByConditions,
  indexConditionsByItemId,
  itemPassesConditions,
} from '@/utils/itemConditions';

function item(id: string, weight = 1): Pick<WheelItem, 'id' | 'weight' | 'name'> {
  return { id, name: id, weight };
}

describe('itemConditions', () => {
  describe('evaluateItemCondition', () => {
    it('treats always as eligible', () => {
      expect(
        evaluateItemCondition(createAlwaysCondition('card'), item('card'), {
          selectedItemIds: [],
        }),
      ).toBe(true);
    });

    it('requires a prior selected item id (parent or earlier)', () => {
      const condition = createRequiresSelectedItemCondition('bank', 'fpx');

      expect(
        evaluateItemCondition(condition, item('bank'), { selectedItemIds: ['payment'] }),
      ).toBe(false);
      expect(
        evaluateItemCondition(condition, item('bank'), {
          selectedItemIds: ['payment', 'fpx'],
        }),
      ).toBe(true);
    });

    it('requires any of several prior selections', () => {
      const condition = createRequiresAnySelectedItemCondition('provider', [
        'credit-card',
        'e-wallet',
      ]);

      expect(
        evaluateItemCondition(condition, item('provider'), { selectedItemIds: ['fpx'] }),
      ).toBe(false);
      expect(
        evaluateItemCondition(condition, item('provider'), {
          selectedItemIds: ['payment', 'e-wallet'],
        }),
      ).toBe(true);
    });

    it('enforces max wins against map or record counts', () => {
      const condition = createMaxWinsCondition('pizza', 2);

      expect(evaluateItemCondition(condition, item('pizza'), { winCounts: { pizza: 1 } })).toBe(
        true,
      );
      expect(
        evaluateItemCondition(condition, item('pizza'), {
          winCounts: new Map([['pizza', 2]]),
        }),
      ).toBe(false);
      expect(
        evaluateItemCondition(condition, item('pizza'), {
          winCounts: new Map([['other', 9]]),
        }),
      ).toBe(true);
      expect(evaluateItemCondition(condition, item('pizza'), {})).toBe(true);
      expect(
        evaluateItemCondition(condition, item('pizza'), {
          winCounts: { pizza: Number.NaN },
        }),
      ).toBe(true);
      expect(
        evaluateItemCondition(condition, item('pizza'), {
          winCounts: { pizza: '2' as unknown as number },
        }),
      ).toBe(true);
    });

    it('enforces minimum weight on the evaluated item', () => {
      const condition = createMinWeightCondition('rare', 3);

      expect(evaluateItemCondition(condition, item('rare', 2), {})).toBe(false);
      expect(evaluateItemCondition(condition, item('rare', 3), {})).toBe(true);
    });

    it('accepts a selected-id Set and fails closed for unknown kinds', () => {
      const condition = createRequiresSelectedItemCondition('bank', 'fpx');

      expect(
        evaluateItemCondition(condition, item('bank'), {
          selectedItemIds: new Set(['fpx']),
        }),
      ).toBe(true);

      expect(
        evaluateItemCondition(
          { id: 'future', itemId: 'bank', kind: 'future_kind' } as ItemCondition,
          item('bank'),
        ),
      ).toBe(false);
    });
  });

  describe('itemPassesConditions', () => {
    it('passes when the item has no conditions', () => {
      expect(itemPassesConditions(item('root'), undefined)).toBe(true);
      expect(itemPassesConditions(item('root'), [])).toBe(true);
      expect(
        itemPassesConditions(item('root'), [createAlwaysCondition('other')]),
      ).toBe(true);
    });

    it('requires every condition for the same item (AND)', () => {
      const conditions: ItemCondition[] = [
        createRequiresSelectedItemCondition('bank', 'fpx', 'c1'),
        createMinWeightCondition('bank', 2, 'c2'),
      ];

      expect(
        itemPassesConditions(item('bank', 2), conditions, {
          selectedItemIds: ['fpx'],
        }),
      ).toBe(true);
      expect(
        itemPassesConditions(item('bank', 1), conditions, {
          selectedItemIds: ['fpx'],
        }),
      ).toBe(false);
      expect(
        itemPassesConditions(item('bank', 2), conditions, {
          selectedItemIds: [],
        }),
      ).toBe(false);
    });
  });

  describe('filterItemsByConditions', () => {
    it('returns only children valid for the selected parent path', () => {
      const cardNumber = item('card-number');
      const bank = item('bank');
      const wallet = item('wallet-provider');
      const children = [cardNumber, bank, wallet];

      const conditions: ItemCondition[] = [
        createRequiresSelectedItemCondition('card-number', 'credit-card', 'c-card'),
        createRequiresSelectedItemCondition('bank', 'fpx', 'c-bank'),
        createRequiresSelectedItemCondition('wallet-provider', 'e-wallet', 'c-wallet'),
      ];

      expect(
        filterItemsByConditions(children, conditions, {
          selectedItemIds: ['payment', 'credit-card'],
        }).map((entry) => entry.id),
      ).toEqual(['card-number']);

      expect(
        filterItemsByConditions(children, conditions, {
          selectedItemIds: ['payment', 'fpx'],
        }).map((entry) => entry.id),
      ).toEqual(['bank']);

      expect(
        filterItemsByConditions(children, conditions, {
          selectedItemIds: ['payment', 'e-wallet'],
        }).map((entry) => entry.id),
      ).toEqual(['wallet-provider']);
    });

    it('clones the list when there are no conditions', () => {
      const items = [item('a'), item('b')];
      const filtered = filterItemsByConditions(items, undefined, {});
      expect(filtered).toEqual(items);
      expect(filtered).not.toBe(items);
    });

    it('keeps items that have no matching conditions while filtering others', () => {
      const free = item('free');
      const bank = item('bank');

      expect(
        filterItemsByConditions([free, bank], [createRequiresSelectedItemCondition('bank', 'fpx')], {
          selectedItemIds: [],
        }).map((entry) => entry.id),
      ).toEqual(['free']);
    });
  });

  describe('indexConditionsByItemId', () => {
    it('groups conditions by item id', () => {
      const conditions: ItemCondition[] = [
        createAlwaysCondition('a', '1'),
        createMaxWinsCondition('b', 1, '2'),
        createMinWeightCondition('a', 1, '3'),
      ];

      const index = indexConditionsByItemId(conditions);
      expect(index.get('a')?.map((entry) => entry.id)).toEqual(['1', '3']);
      expect(index.get('b')?.map((entry) => entry.id)).toEqual(['2']);
      expect(indexConditionsByItemId(undefined).size).toBe(0);
    });
  });

  describe('factories', () => {
    it('build serializable condition objects', () => {
      expect(createAlwaysCondition('x', 'id-1')).toEqual({
        id: 'id-1',
        itemId: 'x',
        kind: ITEM_CONDITION_KIND.always,
      });
      expect(createRequiresAnySelectedItemCondition('y', ['a', 'b'], 'id-2')).toEqual({
        id: 'id-2',
        itemId: 'y',
        kind: ITEM_CONDITION_KIND.requiresAnySelectedItem,
        requiredItemIds: ['a', 'b'],
      });

      expect(createAlwaysCondition('auto').id).toEqual(expect.any(String));
      expect(createRequiresSelectedItemCondition('a', 'b').requiredItemId).toBe('b');
      expect(createRequiresAnySelectedItemCondition('a', ['b']).requiredItemIds).toEqual(['b']);
      expect(createMaxWinsCondition('a', 3).limit).toBe(3);
      expect(createMinWeightCondition('a', 4).minWeight).toBe(4);
    });
  });
});
