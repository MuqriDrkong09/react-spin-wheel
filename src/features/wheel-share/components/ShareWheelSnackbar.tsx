import { Alert, Snackbar } from '@mui/material';

import type { WheelShareStatus } from '@/features/wheel-share/types';

interface ShareWheelSnackbarProps {
  status: WheelShareStatus | null;
  onClose: () => void;
}

export function ShareWheelSnackbar({ status, onClose }: ShareWheelSnackbarProps) {
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
