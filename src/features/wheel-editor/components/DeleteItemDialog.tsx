import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

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
    <Dialog
      open
      onClose={onCancel}
      transitionDuration={0}
      closeAfterTransition={false}
      aria-labelledby="delete-item-title"
    >
      <DialogTitle id="delete-item-title">Delete item</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {descendantCount > 0
            ? EDITOR_MESSAGES.deleteItemWithChildren(node.name, descendantCount)
            : EDITOR_MESSAGES.deleteItem(node.name)}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
