import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { HISTORY_MESSAGES } from '@/features/history/constants';

interface HistoryConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function HistoryConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: HistoryConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={HISTORY_MESSAGES.cancel}
      titleId="history-confirm-title"
      descriptionId="history-confirm-description"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
