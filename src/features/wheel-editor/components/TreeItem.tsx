import { Box } from '@mui/material';

import { TreeEmptyChildren } from '@/features/wheel-editor/components/TreeEmptyChildren';
import type { TreeItemHandlers } from '@/features/wheel-editor/components/TreeItemActions';
import { TreeItemRow } from '@/features/wheel-editor/components/TreeItemRow';
import { toDroppableId } from '@/features/wheel-editor/utils/dndTree';
import type { EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import { useDroppable } from '@/utils/dnd';

export interface TreeItemProps {
  node: EditorTreeNode;
  expandedIds: ReadonlySet<string>;
  handlers: TreeItemHandlers;
  onToggleExpand: (id: string) => void;
  blockedParentIds?: ReadonlySet<string>;
}

export function TreeItem({
  node,
  expandedIds,
  handlers,
  onToggleExpand,
  blockedParentIds,
}: TreeItemProps) {
  const isExpanded = expandedIds.has(node.id);
  const { setNodeRef, isOver } = useDroppable({
    id: toDroppableId(node.id),
    disabled: !isExpanded || Boolean(blockedParentIds?.has(node.id)),
  });

  return (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <TreeItemRow
        node={node}
        isExpanded={isExpanded}
        handlers={handlers}
        onToggleExpand={() => onToggleExpand(node.id)}
      />
      {isExpanded ? (
        <Box
          ref={setNodeRef}
          role="group"
          aria-label={`Children of ${node.name}`}
          sx={{
            ml: { xs: 1.25, sm: 2 },
            pl: { xs: 1.25, sm: 2 },
            borderLeft: '2px solid',
            borderColor: isOver ? 'primary.main' : 'divider',
            bgcolor: isOver ? 'action.selected' : 'transparent',
            borderRadius: 1,
            minHeight: 12,
          }}
        >
          {node.children.length === 0 ? (
            <TreeEmptyChildren name={node.name} onAddChild={() => handlers.onAddChild(node.id)} />
          ) : (
            <Box component="ul" sx={{ m: 0, p: 0 }}>
              {node.children.map((child) => (
                <TreeItem
                  key={child.id}
                  node={child}
                  expandedIds={expandedIds}
                  handlers={handlers}
                  onToggleExpand={onToggleExpand}
                  blockedParentIds={blockedParentIds}
                />
              ))}
            </Box>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
