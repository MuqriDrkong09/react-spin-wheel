import type { HexColor, Wheel, WheelItem, WheelItemId } from '@/types/wheel';

export const TREE_NODE_KIND = {
  wheel: 'wheel',
  item: 'item',
} as const;

export type TreeNodeKind = (typeof TREE_NODE_KIND)[keyof typeof TREE_NODE_KIND];

export interface EditorTreeNode {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  color?: HexColor;
  enabled: boolean;
  weight: number;
  kind: TreeNodeKind;
  children: EditorTreeNode[];
}

export function toEditorTree(wheel: Wheel): EditorTreeNode {
  return {
    id: wheel.id,
    name: wheel.name,
    icon: wheel.icon || '📁',
    description: wheel.description,
    enabled: true,
    weight: 1,
    kind: TREE_NODE_KIND.wheel,
    children: wheel.items.map(toItemNode),
  };
}

export function collectExpandedIds(node: EditorTreeNode): string[] {
  const ids: string[] = [];

  if (node.kind === TREE_NODE_KIND.wheel || node.children.length > 0) {
    ids.push(node.id);
  }

  for (const child of node.children) {
    ids.push(...collectExpandedIds(child));
  }

  return ids;
}

export function collectNodeIds(node: EditorTreeNode): string[] {
  return [node.id, ...node.children.flatMap(collectNodeIds)];
}

export function countDescendants(node: EditorTreeNode): number {
  return node.children.reduce((total, child) => total + 1 + countDescendants(child), 0);
}

export function findTreeNode(node: EditorTreeNode, id: WheelItemId | string): EditorTreeNode | undefined {
  if (node.id === id) {
    return node;
  }

  for (const child of node.children) {
    const match = findTreeNode(child, id);
    if (match) {
      return match;
    }
  }

  return undefined;
}

function toItemNode(item: WheelItem): EditorTreeNode {
  return {
    id: item.id,
    name: item.name,
    icon: item.icon,
    description: item.description,
    color: item.color,
    enabled: item.enabled,
    weight: item.weight,
    kind: TREE_NODE_KIND.item,
    children: (item.children ?? []).map(toItemNode),
  };
}
