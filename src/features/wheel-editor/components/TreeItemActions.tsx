import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Button, IconButton, Stack } from '@mui/material';

import { TREE_NODE_KIND, type EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';

export interface TreeItemHandlers {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onDuplicate: (id: string) => void;
}

interface TreeItemActionsProps {
  node: EditorTreeNode;
  handlers: TreeItemHandlers;
}

export function TreeItemActions({ node, handlers }: TreeItemActionsProps) {
  const isItem = node.kind === TREE_NODE_KIND.item;

  return (
    <Stack
      direction="row"
      sx={{
        flexWrap: 'wrap',
        gap: 0.25,
        justifyContent: { xs: 'flex-start', sm: 'flex-end' },
        flexShrink: 0,
      }}
    >
      <IconButton size="small" aria-label={`Edit ${node.name}`} onClick={() => handlers.onEdit(node.id)}>
        <EditOutlinedIcon fontSize="small" />
      </IconButton>
      <Button
        size="small"
        startIcon={<AddIcon />}
        aria-label={`Add child to ${node.name}`}
        onClick={() => handlers.onAddChild(node.id)}
      >
        Add Child
      </Button>
      {isItem ? (
        <IconButton
          size="small"
          aria-label={node.enabled ? `Disable ${node.name}` : `Enable ${node.name}`}
          onClick={() => handlers.onToggleEnabled(node.id)}
        >
          {node.enabled ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
        </IconButton>
      ) : null}
      {isItem ? (
        <IconButton
          size="small"
          aria-label={`Duplicate ${node.name}`}
          onClick={() => handlers.onDuplicate(node.id)}
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      ) : null}
      {isItem ? (
        <IconButton
          size="small"
          color="error"
          aria-label={`Delete ${node.name}`}
          onClick={() => handlers.onDelete(node.id)}
        >
          <DeleteOutlinedIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  );
}
