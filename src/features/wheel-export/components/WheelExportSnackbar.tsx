import { AppToast } from '@/components/feedback/AppToast';
import type { WheelExportStatus } from '@/features/wheel-export/types';

interface WheelExportSnackbarProps {
  status: WheelExportStatus | null;
  onClose: () => void;
}

export function WheelExportSnackbar({ status, onClose }: WheelExportSnackbarProps) {
  return (
    <AppToast
      open={Boolean(status)}
      message={status?.message}
      severity={status?.severity ?? 'success'}
      onClose={onClose}
    />
  );
}
