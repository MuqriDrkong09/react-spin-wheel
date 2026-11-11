import { ITEM_CONDITION_KIND, type ItemCondition, type WheelItem, type WheelItemId } from '@/types/wheel';
import { createId } from '@/utils/id';

/** Runtime context used when evaluating serializable item conditions. */
export interface ItemConditionContext {
  /** Ids already chosen in this selection (ancestors and current parent). */
  selectedItemIds?: ReadonlySet<WheelItemId> | readonly WheelItemId[];
  /** How many times each item has won (session or history). Missing keys count as 0. */
  winCounts?: ReadonlyMap<WheelItemId, number> | Readonly<Record<string, number>>;
}

export function toSelectedItemIdSet(
  selectedItemIds: ItemConditionContext['selectedItemIds'] = [],
): ReadonlySet<WheelItemId> {
  return selectedItemIds instanceof Set ? selectedItemIds : new Set(selectedItemIds);
}

export function getWinCount(
  winCounts: ItemConditionContext['winCounts'],
  itemId: WheelItemId,
): number {
  if (!winCounts) {
    return 0;
  }

  if (winCounts instanceof Map) {
    return winCounts.get(itemId) ?? 0;
  }

  const value = (winCounts as Readonly<Record<string, number>>)[itemId];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Group wheel-level conditions by the item they gate. */
export function indexConditionsByItemId(
  conditions: readonly ItemCondition[] | undefined,
): ReadonlyMap<WheelItemId, readonly ItemCondition[]> {
  const index = new Map<WheelItemId, ItemCondition[]>();
  if (!conditions?.length) {
    return index;
  }

  for (const condition of conditions) {
    const list = index.get(condition.itemId);
    if (list) {
      list.push(condition);
    } else {
      index.set(condition.itemId, [condition]);
    }
  }

  return index;
}

/**
 * Evaluate a single serializable condition.
 * Unknown future kinds fail closed so persisted data cannot silently unlock items.
 */
export function evaluateItemCondition(
  condition: ItemCondition,
  item: Pick<WheelItem, 'id' | 'weight'>,
  context: ItemConditionContext = {},
): boolean {
  const selected = toSelectedItemIdSet(context.selectedItemIds);

  switch (condition.kind) {
    case ITEM_CONDITION_KIND.always:
      return true;
    case ITEM_CONDITION_KIND.requiresSelectedItem:
      return selected.has(condition.requiredItemId);
    case ITEM_CONDITION_KIND.requiresAnySelectedItem:
      return condition.requiredItemIds.some((id) => selected.has(id));
    case ITEM_CONDITION_KIND.maxWins:
      return getWinCount(context.winCounts, item.id) < condition.limit;
    case ITEM_CONDITION_KIND.minWeight:
      return item.weight >= condition.minWeight;
    default: {
      const _exhaustive: never = condition;
      void _exhaustive;
      return false;
    }
  }
}

/**
 * An item with no conditions is eligible.
 * When one or more conditions target the item, every condition must pass (AND).
 */
export function itemPassesConditions(
  item: Pick<WheelItem, 'id' | 'weight'>,
  conditions: readonly ItemCondition[] | undefined,
  context: ItemConditionContext = {},
): boolean {
  if (!conditions?.length) {
    return true;
  }

  const applicable = conditions.filter((condition) => condition.itemId === item.id);
  if (applicable.length === 0) {
    return true;
  }

  return applicable.every((condition) => evaluateItemCondition(condition, item, context));
}

/** Keep only items that pass their conditions in the given selection context. */
export function filterItemsByConditions<T extends Pick<WheelItem, 'id' | 'weight'>>(
  items: readonly T[],
  conditions: readonly ItemCondition[] | undefined,
  context: ItemConditionContext = {},
): T[] {
  if (!conditions?.length) {
    return items.slice();
  }

  const byItem = indexConditionsByItemId(conditions);
  return items.filter((item) => {
    const applicable = byItem.get(item.id);
    if (!applicable?.length) {
      return true;
    }

    return applicable.every((condition) => evaluateItemCondition(condition, item, context));
  });
}

export function createAlwaysCondition(itemId: WheelItemId, id: string = createId()): ItemCondition {
  return { id, itemId, kind: ITEM_CONDITION_KIND.always };
}

export function createRequiresSelectedItemCondition(
  itemId: WheelItemId,
  requiredItemId: WheelItemId,
  id: string = createId(),
): ItemCondition {
  return {
    id,
    itemId,
    kind: ITEM_CONDITION_KIND.requiresSelectedItem,
    requiredItemId,
  };
}

export function createRequiresAnySelectedItemCondition(
  itemId: WheelItemId,
  requiredItemIds: readonly WheelItemId[],
  id: string = createId(),
): ItemCondition {
  return {
    id,
    itemId,
    kind: ITEM_CONDITION_KIND.requiresAnySelectedItem,
    requiredItemIds: [...requiredItemIds],
  };
}

export function createMaxWinsCondition(
  itemId: WheelItemId,
  limit: number,
  id: string = createId(),
): ItemCondition {
  return { id, itemId, kind: ITEM_CONDITION_KIND.maxWins, limit };
}

export function createMinWeightCondition(
  itemId: WheelItemId,
  minWeight: number,
  id: string = createId(),
): ItemCondition {
  return { id, itemId, kind: ITEM_CONDITION_KIND.minWeight, minWeight };
}
