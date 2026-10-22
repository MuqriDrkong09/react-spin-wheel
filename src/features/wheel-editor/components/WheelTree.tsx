import { Box } from '@mui/material';

import { TreeItem, type TreeItemProps } from '@/features/wheel-editor/components/TreeItem';

interface WheelTreeProps extends Omit<TreeItemProps, 'node'> {
  root: TreeItemProps['node'];
}

export function WheelTree({ root, expandedIds, handlers, onToggleExpand }: WheelTreeProps) {
  return (
    <Box component="ul" aria-label={`${root.name} tree`} sx={{ m: 0, p: 0 }}>
      <TreeItem
        node={root}
        expandedIds={expandedIds}
        handlers={handlers}
        onToggleExpand={onToggleExpand}
      />
    </Box>
  );
}
