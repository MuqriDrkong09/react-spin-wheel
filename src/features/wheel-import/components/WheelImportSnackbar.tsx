import { Alert, Snackbar } from '@mui/material';

import type { WheelImportStatus } from '@/features/wheel-import/types';

interface WheelImportSnackbarProps {
  status: WheelImportStatus | null;
  onClose: () => void;
}

export function WheelImportSnackbar({ status, onClose }: WheelImportSnackbarProps) {
  return (
    <Snackbar
      open={Boolean(status)}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity={status?.severity ?? 'success'} variant="filled" onClose={onClose}>
        {status?.message}
      </Alert>
    </Snackbar>
  );
}
