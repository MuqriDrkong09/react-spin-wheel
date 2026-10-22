import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

import type { Wheel } from '@/types/wheel';

interface DeleteWheelDialogProps {
  wheel?: Wheel | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteWheelDialog({ wheel, onCancel, onConfirm }: DeleteWheelDialogProps) {
  return (
    <Dialog
      open={Boolean(wheel)}
      onClose={onCancel}
      transitionDuration={0}
      closeAfterTransition={false}
      aria-labelledby="delete-wheel-title"
    >
      <DialogTitle id="delete-wheel-title">Delete wheel</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {wheel
            ? `Delete ${wheel.name}? This cannot be undone.`
            : 'Delete this wheel? This cannot be undone.'}
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
