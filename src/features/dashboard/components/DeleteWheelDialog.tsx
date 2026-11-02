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
      fullWidth
      maxWidth="xs"
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
