import { Alert, Snackbar } from '@mui/material';

import type { WheelExportStatus } from '@/features/wheel-export/types';

interface WheelExportSnackbarProps {
  status: WheelExportStatus | null;
  onClose: () => void;
}

export function WheelExportSnackbar({ status, onClose }: WheelExportSnackbarProps) {
  return (
    <Snackbar
      open={Boolean(status)}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={status?.severity ?? 'success'}
        variant="filled"
        onClose={onClose}
      >
        {status?.message}
      </Alert>
    </Snackbar>
  );
}
