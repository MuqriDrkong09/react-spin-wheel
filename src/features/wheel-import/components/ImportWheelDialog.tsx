import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';
import type { FormEvent } from 'react';

import type { WheelImportDocument } from '@/features/wheel-import/types';

interface ImportWheelDialogProps {
  document: WheelImportDocument | null;
  name: string;
  nameError: string | null;
  onNameChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ImportWheelDialog({
  document,
  name,
  nameError,
  onNameChange,
  onCancel,
  onConfirm,
}: ImportWheelDialogProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm();
  };

  return (
    <Dialog
      open={Boolean(document)}
      onClose={onCancel}
      transitionDuration={0}
      closeAfterTransition={false}
      aria-labelledby="import-wheel-title"
    >
      <form aria-label="Import wheel" onSubmit={submit}>
        <DialogTitle id="import-wheel-title">Import wheel</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Review the name, then import. New ids will be generated so this wheel cannot collide
            with wheels you already have.
          </DialogContentText>
          <TextField
            label="Wheel name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            error={Boolean(nameError)}
            helperText={nameError ?? 'You can rename this wheel before it is added.'}
            autoFocus
            required
            fullWidth
            slotProps={{ htmlInput: { 'aria-label': 'Wheel name' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained">
            Import wheel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
