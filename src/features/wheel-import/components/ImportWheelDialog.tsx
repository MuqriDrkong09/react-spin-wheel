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
      fullWidth
      maxWidth="xs"
      aria-labelledby="import-wheel-title"
      sx={{
        '& .MuiDialog-paper': {
          m: { xs: 2, sm: 4 },
          width: { xs: 'calc(100% - 32px)', sm: undefined },
        },
      }}
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
          <Button type="submit" variant="contained">
            Import wheel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
