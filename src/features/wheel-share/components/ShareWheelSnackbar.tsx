import { AppToast } from '@/components/feedback/AppToast';
import type { WheelShareStatus } from '@/features/wheel-share/types';

interface ShareWheelSnackbarProps {
  status: WheelShareStatus | null;
  onClose: () => void;
}

export function ShareWheelSnackbar({ status, onClose }: ShareWheelSnackbarProps) {
  return (
    <AppToast
      open={Boolean(status)}
      message={status?.message}
      severity={status?.severity ?? 'success'}
      onClose={onClose}
    />
  );
}
