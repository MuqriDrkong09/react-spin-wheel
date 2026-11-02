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
      fullWidth
      maxWidth="xs"
      aria-labelledby="history-confirm-title"
    >
      <DialogTitle id="history-confirm-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
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
        <Button onClick={onCancel}>{HISTORY_MESSAGES.cancel}</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
