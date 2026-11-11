import { AppToast } from '@/components/feedback/AppToast';
import type { WheelImportStatus } from '@/features/wheel-import/types';

interface WheelImportSnackbarProps {
  status: WheelImportStatus | null;
  onClose: () => void;
}

export function WheelImportSnackbar({ status, onClose }: WheelImportSnackbarProps) {
  return (
    <AppToast
      open={Boolean(status)}
      message={status?.message}
      severity={status?.severity ?? 'success'}
      onClose={onClose}
    />
  );
}
