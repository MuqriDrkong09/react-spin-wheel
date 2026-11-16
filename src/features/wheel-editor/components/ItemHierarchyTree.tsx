import { Box, Typography } from '@mui/material';

import type { EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';

interface ItemHierarchyTreeProps {
  nodes: readonly EditorTreeNode[];
}

export function ItemHierarchyTree({ nodes }: ItemHierarchyTreeProps) {
  if (nodes.length === 0) {
    return null;
  }

  return (
    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
      {nodes.map((node) => (
        <Box component="li" key={node.id} sx={{ mt: 0.5 }}>
          <Typography component="span">
            {node.icon ? `${node.icon} ${node.name}` : node.name}
            {!node.enabled ? ' (disabled)' : ''}
          </Typography>
          {node.children.length > 0 ? <ItemHierarchyTree nodes={node.children} /> : null}
        </Box>
      ))}
    </Box>
  );
}
