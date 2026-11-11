import { createId } from '@/utils/id';
import { ITEM_CONDITION_KIND, type ItemCondition, type Wheel, type WheelItem, type WheelItemId } from '@/types/wheel';

export interface SanitizeHierarchyResult<T> {
  value: T;
  repaired: boolean;
}

/** Repairs duplicate ids, invalid weights, and dangling conditions without throwing. */
export function sanitizeWheelHierarchy(wheel: Wheel): SanitizeHierarchyResult<Wheel> {
  const itemsResult = sanitizeItemTree(wheel.items);
  const itemIds = collectItemIds(itemsResult.value);
  const conditionsResult = sanitizeConditions(wheel.conditions, itemIds);

  return {
    value: {
      ...wheel,
      items: itemsResult.value,
      conditions: conditionsResult.value,
    },
    repaired: itemsResult.repaired || conditionsResult.repaired,
  };
}

export function sanitizeWheels(wheels: readonly Wheel[]): SanitizeHierarchyResult<Wheel[]> {
  let repaired = false;
  const value = wheels.map((wheel) => {
    if (!wheel.id || !wheel.name) {
      repaired = true;
      return {
        ...wheel,
        id: wheel.id || createId(),
        name: wheel.name?.trim() || 'Untitled wheel',
        items: sanitizeItemTree(wheel.items ?? []).value,
      };
    }

    const next = sanitizeWheelHierarchy(wheel);
    repaired = repaired || next.repaired;
    return next.value;
  });

  return { value, repaired };
}

export function sanitizeItemTree(
  items: readonly WheelItem[],
  seen: Set<WheelItemId> = new Set(),
): SanitizeHierarchyResult<WheelItem[]> {
  let repaired = false;
  const value: WheelItem[] = [];

  for (const item of items) {
    let next: WheelItem = { ...item };

    if (!next.id || seen.has(next.id)) {
      next = { ...next, id: createId() };
      repaired = true;
    }
    seen.add(next.id);

    if (!next.name?.trim()) {
      next = { ...next, name: 'Untitled item' };
      repaired = true;
    }

    if (!Number.isFinite(next.weight) || next.weight < 0) {
      next = { ...next, weight: 1 };
      repaired = true;
    }

    if (next.children) {
      const children = sanitizeItemTree(next.children, seen);
      next = { ...next, children: children.value.length > 0 ? children.value : undefined };
      repaired = repaired || children.repaired;
    }

    value.push(next);
  }

  return { value, repaired };
}

function sanitizeConditions(
  conditions: readonly ItemCondition[] | undefined,
  itemIds: ReadonlySet<WheelItemId>,
): SanitizeHierarchyResult<ItemCondition[] | undefined> {
  if (!conditions || conditions.length === 0) {
    return {
      value: conditions === undefined ? undefined : [...conditions],
      repaired: false,
    };
  }

  let repaired = false;
  const value: ItemCondition[] = [];

  for (const condition of conditions) {
    if (!itemIds.has(condition.itemId)) {
      repaired = true;
      continue;
    }

    if (condition.kind === ITEM_CONDITION_KIND.requiresSelectedItem) {
      if (!itemIds.has(condition.requiredItemId)) {
        repaired = true;
        continue;
      }
      value.push(condition);
      continue;
    }

    if (condition.kind === ITEM_CONDITION_KIND.requiresAnySelectedItem) {
      const requiredItemIds = condition.requiredItemIds.filter((id) => itemIds.has(id));
      if (requiredItemIds.length === 0) {
        repaired = true;
        continue;
      }
      if (requiredItemIds.length !== condition.requiredItemIds.length) {
        repaired = true;
      }
      value.push({ ...condition, requiredItemIds });
      continue;
    }

    if (condition.kind === ITEM_CONDITION_KIND.maxWins) {
      if (!Number.isFinite(condition.limit) || condition.limit < 0) {
        repaired = true;
        continue;
      }
      value.push(condition);
      continue;
    }

    if (condition.kind === ITEM_CONDITION_KIND.minWeight) {
      if (!Number.isFinite(condition.minWeight) || condition.minWeight < 0) {
        repaired = true;
        continue;
      }
      value.push(condition);
      continue;
    }

    value.push(condition);
  }

  return {
    value: value.length > 0 ? value : undefined,
    repaired: repaired || value.length !== conditions.length,
  };
}

function collectItemIds(items: readonly WheelItem[]): Set<WheelItemId> {
  const ids = new Set<WheelItemId>();

  function walk(nodes: readonly WheelItem[]) {
    for (const node of nodes) {
      ids.add(node.id);
      if (node.children?.length) {
        walk(node.children);
      }
    }
  }

  walk(items);
  return ids;
}
