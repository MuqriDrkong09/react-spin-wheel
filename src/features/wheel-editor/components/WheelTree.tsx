import { Box, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import { TreeItem, type TreeItemProps } from '@/features/wheel-editor/components/TreeItem';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import {
  blockedParentIds,
  collectVisibleItemIds,
  parseDroppableId,
  resolveTreeMove,
  treeCollisionDetection,
} from '@/features/wheel-editor/utils/dndTree';
import { findTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  SortableContext,
  sortableKeyboardCoordinates,
  useSensor,
  useSensors,
  verticalListSortingStrategy,
  type DragEndEvent,
  type DragStartEvent,
} from '@/utils/dnd';
import type { ItemMove } from '@/utils/wheelTree';

interface WheelTreeProps extends Omit<TreeItemProps, 'node' | 'blockedParentIds'> {
  root: TreeItemProps['node'];
  onMove: (move: ItemMove) => void;
}

export function WheelTree({
  root,
  expandedIds,
  handlers,
  onToggleExpand,
  onMove,
}: WheelTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const visibleItemIds = useMemo(
    () => collectVisibleItemIds(root, expandedIds),
    [expandedIds, root],
  );
  const blockedIds = useMemo(
    () => (activeId ? blockedParentIds(root, activeId) : undefined),
    [activeId, root],
  );
  const activeNode = activeId ? findTreeNode(root, activeId) : undefined;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const move = resolveTreeMove(
      root,
      expandedIds,
      String(event.active.id),
      event.over ? String(event.over.id) : null,
    );
    setActiveId(null);
    if (move) {
      onMove(move);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={treeCollisionDetection}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) =>
            EDITOR_MESSAGES.dndPickedUp(findTreeNode(root, String(active.id))?.name ?? 'item'),
          onDragOver: ({ active, over }) => {
            if (!over) {
              return EDITOR_MESSAGES.dndPickedUp(
                findTreeNode(root, String(active.id))?.name ?? 'item',
              );
            }

            const activeName = findTreeNode(root, String(active.id))?.name ?? 'item';
            const dropParentId = parseDroppableId(String(over.id));
            const overName = dropParentId
              ? `children of ${findTreeNode(root, dropParentId)?.name ?? 'item'}`
              : (findTreeNode(root, String(over.id))?.name ?? 'item');
            return EDITOR_MESSAGES.dndMovedOver(activeName, overName);
          },
          onDragEnd: ({ active }) =>
            EDITOR_MESSAGES.dndDropped(findTreeNode(root, String(active.id))?.name ?? 'item'),
          onDragCancel: ({ active }) =>
            EDITOR_MESSAGES.dndCancelled(findTreeNode(root, String(active.id))?.name ?? 'item'),
        },
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={visibleItemIds} strategy={verticalListSortingStrategy}>
        <Box component="ul" aria-label={`${root.name} tree`} sx={{ m: 0, p: 0 }}>
          <TreeItem
            node={root}
            expandedIds={expandedIds}
            handlers={handlers}
            onToggleExpand={onToggleExpand}
            blockedParentIds={blockedIds}
          />
        </Box>
      </SortableContext>
      <DragOverlay>
        {activeNode ? (
          <Typography sx={{ fontWeight: 600 }}>
            {activeNode.icon ? `${activeNode.icon} ${activeNode.name}` : activeNode.name}
          </Typography>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
