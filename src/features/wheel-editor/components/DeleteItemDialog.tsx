import { Box, Typography } from '@mui/material';

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import { countDescendants, type EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';

interface DeleteItemDialogProps {
  node?: EditorTreeNode;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteItemDialog({ node, onCancel, onConfirm }: DeleteItemDialogProps) {
  if (!node) {
    return null;
  }

  const descendantCount = countDescendants(node);

  return (
    <ConfirmDialog
      open
      title="Delete item"
      titleId="delete-item-title"
      descriptionId="delete-item-description"
      description={
        <Box>
          <Typography component="span" variant="body1" color="text.secondary">
            {EDITOR_MESSAGES.deleteItem(node.name)}
          </Typography>
          {descendantCount > 0 ? (
            <Typography component="p" variant="body1" color="text.secondary" sx={{ mt: 1.5, mb: 0 }}>
              {EDITOR_MESSAGES.deleteDescendantsWarning(descendantCount)}
            </Typography>
          ) : null}
        </Box>
      }
      confirmLabel="Delete"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
