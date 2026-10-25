import type { EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import { findTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import type { WheelItemId } from '@/types/wheel';
import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
} from '@/utils/dnd';
import type { ItemMove } from '@/utils/wheelTree';

export const DROP_ID_PREFIX = 'drop:';

interface FlatEditorItem {
  id: string;
  parentId: string | null;
  index: number;
  collapsed: boolean;
  hasChildren: boolean;
}

export function toDroppableId(parentId: string): string {
  return `${DROP_ID_PREFIX}${parentId}`;
}

export function parseDroppableId(id: string): string | null {
  return id.startsWith(DROP_ID_PREFIX) ? id.slice(DROP_ID_PREFIX.length) : null;
}

export function collectVisibleItemIds(
  root: EditorTreeNode,
  expandedIds: ReadonlySet<string>,
): string[] {
  return flattenEditorItems(root.children, expandedIds, null).map((entry) => entry.id);
}

export function blockedParentIds(root: EditorTreeNode, itemId: string): Set<string> {
  const item = findTreeNode(root, itemId);
  if (!item) {
    return new Set();
  }

  return collectSubtreeIds(item);
}

export function canDropUnder(
  root: EditorTreeNode,
  itemId: string,
  targetParentId: string | null,
): boolean {
  if (targetParentId === null) {
    return itemId !== root.id;
  }

  if (targetParentId === itemId) {
    return false;
  }

  const item = findTreeNode(root, itemId);
  if (!item || !findTreeNode(root, targetParentId)) {
    return false;
  }

  return findTreeNode(item, targetParentId) === undefined;
}

export function resolveTreeMove(
  root: EditorTreeNode,
  expandedIds: ReadonlySet<string>,
  activeId: string,
  overId: string | null,
): ItemMove | null {
  if (!overId || activeId === overId || activeId === root.id) {
    return null;
  }

  const flat = flattenEditorItems(root.children, expandedIds, null);
  const active = flat.find((entry) => entry.id === activeId);
  if (!active) {
    return null;
  }

  const dropParentId = parseDroppableId(overId);
  if (dropParentId !== null) {
    const targetParentId = toStoreParentId(root.id, dropParentId);
    return toMove(root, activeId, targetParentId, destinationIndex(flat, active, targetParentId));
  }

  const over = flat.find((entry) => entry.id === overId);
  if (!over) {
    return null;
  }

  if (over.collapsed && over.hasChildren) {
    return toMove(root, activeId, over.id, 0);
  }

  return toMove(root, activeId, over.parentId, siblingIndex(active, over));
}

export function preferItemCollisions<T extends { id: string | number }>(collisions: T[]): T[] {
  const items = collisions.filter((collision) => parseDroppableId(String(collision.id)) === null);
  return items.length > 0 ? items : collisions;
}

export const treeCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const collisions = pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
  return preferItemCollisions(collisions);
};

function flattenEditorItems(
  nodes: EditorTreeNode[],
  expandedIds: ReadonlySet<string>,
  parentId: string | null,
): FlatEditorItem[] {
  return nodes.flatMap((node, index) => {
    const current: FlatEditorItem = {
      id: node.id,
      parentId,
      index,
      collapsed: !expandedIds.has(node.id),
      hasChildren: node.children.length > 0,
    };

    if (!expandedIds.has(node.id)) {
      return [current];
    }

    return [current, ...flattenEditorItems(node.children, expandedIds, node.id)];
  });
}

function collectSubtreeIds(node: EditorTreeNode): Set<string> {
  return new Set([node.id, ...node.children.flatMap((child) => [...collectSubtreeIds(child)])]);
}

function toStoreParentId(rootId: string, parentId: string): WheelItemId | null {
  return parentId === rootId ? null : parentId;
}

function destinationIndex(
  flat: FlatEditorItem[],
  active: FlatEditorItem,
  targetParentId: string | null,
): number {
  const siblings = flat.filter((entry) => entry.parentId === targetParentId);
  if (active.parentId === targetParentId) {
    return Math.max(0, siblings.length - 1);
  }

  return siblings.length;
}

function siblingIndex(active: FlatEditorItem, over: FlatEditorItem): number {
  if (active.parentId === over.parentId && active.index < over.index) {
    return over.index;
  }

  return over.index;
}

function toMove(
  root: EditorTreeNode,
  itemId: string,
  targetParentId: string | null,
  index: number,
): ItemMove | null {
  if (!canDropUnder(root, itemId, targetParentId)) {
    return null;
  }

  return {
    itemId,
    targetParentId,
    index,
  };
}
