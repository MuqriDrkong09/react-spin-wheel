import { Alert, Snackbar, type AlertColor } from '@mui/material';

export interface AppToastProps {
  open: boolean;
  message?: string;
  severity?: AlertColor;
  autoHideDuration?: number;
  onClose: () => void;
}

export function AppToast({
  open,
  message,
  severity = 'success',
  autoHideDuration = 4000,
  onClose,
}: AppToastProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity={severity} variant="filled" onClose={onClose} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
