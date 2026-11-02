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
      fullWidth
      maxWidth="xs"
      aria-labelledby="delete-item-title"
      aria-describedby="delete-item-description"
    >
      <DialogTitle id="delete-item-title">Delete item</DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-item-description">
          {EDITOR_MESSAGES.deleteItem(node.name)}
        </DialogContentText>
        {descendantCount > 0 ? (
          <DialogContentText sx={{ mt: 1.5 }}>
            {EDITOR_MESSAGES.deleteDescendantsWarning(descendantCount)}
          </DialogContentText>
        ) : null}
      </DialogContent>
      <DialogActions
        sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          px: 3,
          pb: 2,
          gap: 1,
          '& > :not(style)': { m: 0, width: { xs: '100%', sm: 'auto' } },
        }}
      >
        <Button onClick={onCancel}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
