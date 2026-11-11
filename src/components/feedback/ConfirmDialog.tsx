import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import type { ReactNode } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmColor?: 'error' | 'primary' | 'warning';
  titleId?: string;
  descriptionId?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmColor = 'error',
  titleId = 'confirm-dialog-title',
  descriptionId = 'confirm-dialog-description',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      transitionDuration={0}
      closeAfterTransition={false}
      fullWidth
      maxWidth="xs"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={descriptionId} component="div">
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: 1,
          '& > :not(style)': { m: 0, width: { xs: '100%', sm: 'auto' } },
        }}
      >
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button color={confirmColor} variant="contained" onClick={onConfirm} autoFocus>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
