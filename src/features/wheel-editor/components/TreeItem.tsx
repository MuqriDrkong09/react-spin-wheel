import { Box } from '@mui/material';

import { TreeEmptyChildren } from '@/features/wheel-editor/components/TreeEmptyChildren';
import type { TreeItemHandlers } from '@/features/wheel-editor/components/TreeItemActions';
import { TreeItemRow } from '@/features/wheel-editor/components/TreeItemRow';
import type { EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';

export interface TreeItemProps {
  node: EditorTreeNode;
  expandedIds: ReadonlySet<string>;
  handlers: TreeItemHandlers;
  onToggleExpand: (id: string) => void;
}

export function TreeItem({ node, expandedIds, handlers, onToggleExpand }: TreeItemProps) {
  const isExpanded = expandedIds.has(node.id);

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
          role="group"
          aria-label={`Children of ${node.name}`}
          sx={{
            ml: { xs: 1.25, sm: 2 },
            pl: { xs: 1.25, sm: 2 },
            borderLeft: '2px solid',
            borderColor: 'divider',
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
                />
              ))}
            </Box>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
