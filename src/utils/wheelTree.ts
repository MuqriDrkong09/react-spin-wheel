import { createId, nowIso } from '@/utils/id';
import type { Patch, WheelItem, WheelItemDraft, WheelItemId } from '@/types/wheel';

export type NewWheelItemInput = WheelItemDraft & {
  id?: WheelItemId;
};

export type WheelItemPatch = Omit<Patch<WheelItem>, 'children' | 'createdAt'>;

export function materializeItem(input: NewWheelItemInput): WheelItem {
  const timestamp = nowIso();

  return {
    id: input.id ?? createId(),
    name: input.name,
    description: input.description,
    icon: input.icon,
    color: input.color,
    enabled: input.enabled,
    weight: input.weight,
    createdAt: timestamp,
    updatedAt: timestamp,
    children: input.children?.map(materializeItem),
  };
}

export function cloneItemsPreserveIds(items: WheelItem[]): WheelItem[] {
  return items.map((item) => ({
    ...item,
    children: item.children ? cloneItemsPreserveIds(item.children) : item.children,
  }));
}

export function cloneItemTree(item: WheelItem): WheelItem {
  const timestamp = nowIso();

  return {
    ...item,
    id: createId(),
    name: item.name,
    createdAt: timestamp,
    updatedAt: timestamp,
    children: item.children?.map(cloneItemTree),
  };
}

export function findItem(items: WheelItem[], itemId: WheelItemId): WheelItem | undefined {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }

    if (item.children) {
      const nested = findItem(item.children, itemId);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

export function mapItemTree(
  items: WheelItem[],
  itemId: WheelItemId,
  updater: (item: WheelItem) => WheelItem,
): WheelItem[] {
  let changed = false;

  const nextItems = items.map((item) => {
    if (item.id === itemId) {
      changed = true;
      return updater(item);
    }

    if (!item.children?.length) {
      return item;
    }

    const children = mapItemTree(item.children, itemId, updater);
    if (children === item.children) {
      return item;
    }

    changed = true;
    return {
      ...item,
      children,
      updatedAt: nowIso(),
    };
  });

  return changed ? nextItems : items;
}

export function addChildToTree(
  items: WheelItem[],
  parentId: WheelItemId,
  child: WheelItem,
): WheelItem[] {
  let added = false;

  const nextItems = items.map((item) => {
    if (item.id === parentId) {
      added = true;
      return {
        ...item,
        children: [...(item.children ?? []), child],
        updatedAt: nowIso(),
      };
    }

    if (!item.children?.length) {
      return item;
    }

    const children = addChildToTree(item.children, parentId, child);
    if (children === item.children) {
      return item;
    }

    added = true;
    return {
      ...item,
      children,
      updatedAt: nowIso(),
    };
  });

  return added ? nextItems : items;
}

export function removeItemFromTree(items: WheelItem[], itemId: WheelItemId): WheelItem[] {
  const withoutItem = items.filter((item) => item.id !== itemId);
  let changed = withoutItem.length !== items.length;

  const nextItems = withoutItem.map((item) => {
    if (!item.children?.length) {
      return item;
    }

    const children = removeItemFromTree(item.children, itemId);
    if (children === item.children) {
      return item;
    }

    changed = true;
    return {
      ...item,
      children,
      updatedAt: nowIso(),
    };
  });

  return changed ? nextItems : items;
}

export function duplicateItemInTree(
  items: WheelItem[],
  itemId: WheelItemId,
): { items: WheelItem[]; copy?: WheelItem } {
  const index = items.findIndex((item) => item.id === itemId);

  if (index !== -1) {
    const original = items[index];
    if (!original) {
      return { items };
    }

    const copy = {
      ...cloneItemTree(original),
      name: `${original.name} copy`,
    };
    const nextItems = [...items.slice(0, index + 1), copy, ...items.slice(index + 1)];

    return { items: nextItems, copy };
  }

  let copy: WheelItem | undefined;
  const nextItems = items.map((item) => {
    if (!item.children?.length) {
      return item;
    }

    const nested = duplicateItemInTree(item.children, itemId);
    if (!nested.copy) {
      return item;
    }

    copy = nested.copy;
    return {
      ...item,
      children: nested.items,
      updatedAt: nowIso(),
    };
  });

  return { items: copy ? nextItems : items, copy };
}

export function reorderSiblings(
  items: WheelItem[],
  parentId: WheelItemId | null,
  orderedIds: WheelItemId[],
): WheelItem[] {
  if (parentId === null) {
    return orderByIds(items, orderedIds);
  }

  return mapItemTree(items, parentId, (item) => ({
    ...item,
    children: orderByIds(item.children ?? [], orderedIds),
    updatedAt: nowIso(),
  }));
}

function orderByIds(items: WheelItem[], orderedIds: WheelItemId[]): WheelItem[] {
  const remaining = new Map(items.map((item) => [item.id, item]));
  const ordered: WheelItem[] = [];

  for (const id of orderedIds) {
    const item = remaining.get(id);
    if (!item) {
      continue;
    }

    ordered.push(item);
    remaining.delete(id);
  }

  for (const item of remaining.values()) {
    ordered.push(item);
  }

  return ordered;
}

export function patchItem(item: WheelItem, patch: WheelItemPatch): WheelItem {
  return {
    ...item,
    ...patch,
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: nowIso(),
  };
}
