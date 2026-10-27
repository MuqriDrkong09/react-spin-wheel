import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

import { HISTORY_MESSAGES } from '@/features/history/constants';

interface HistoryConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function HistoryConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: HistoryConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      transitionDuration={0}
      closeAfterTransition={false}
      aria-labelledby="history-confirm-title"
    >
      <DialogTitle id="history-confirm-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{HISTORY_MESSAGES.cancel}</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
