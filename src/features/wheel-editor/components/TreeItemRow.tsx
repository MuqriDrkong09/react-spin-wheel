import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material';

import { TreeItemActions, type TreeItemHandlers } from '@/features/wheel-editor/components/TreeItemActions';
import { TREE_NODE_KIND, type EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';

interface TreeItemRowProps {
  node: EditorTreeNode;
  isExpanded: boolean;
  handlers: TreeItemHandlers;
  onToggleExpand: () => void;
}

export function TreeItemRow({ node, isExpanded, handlers, onToggleExpand }: TreeItemRowProps) {
  const isWheel = node.kind === TREE_NODE_KIND.wheel;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      sx={{
        alignItems: { sm: 'center' },
        justifyContent: 'space-between',
        py: 0.75,
        px: { xs: 0.5, sm: 1 },
        borderRadius: 1,
        opacity: node.enabled ? 1 : 0.55,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
        <IconButton
          size="small"
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.name}`}
          aria-expanded={isExpanded}
          onClick={onToggleExpand}
        >
          {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </IconButton>
        {node.color ? (
          <Box
            aria-hidden
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: node.color,
              flexShrink: 0,
            }}
          />
        ) : null}
        <Typography
          variant={isWheel ? 'subtitle1' : 'body1'}
          component={isWheel ? 'h2' : 'span'}
          sx={{
            fontWeight: isWheel ? 700 : 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {node.icon ? `${node.icon} ${node.name}` : node.name}
        </Typography>
        {!node.enabled ? <Chip label="Disabled" size="small" variant="outlined" /> : null}
      </Stack>
      <TreeItemActions node={node} handlers={handlers} />
    </Stack>
  );
}
