import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import type { Wheel } from '@/types/wheel';

interface DeleteWheelDialogProps {
  wheel?: Wheel | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteWheelDialog({ wheel, onCancel, onConfirm }: DeleteWheelDialogProps) {
  return (
    <ConfirmDialog
      open={Boolean(wheel)}
      title="Delete wheel"
      titleId="delete-wheel-title"
      descriptionId="delete-wheel-description"
      description={
        wheel
          ? `Delete ${wheel.name}? This cannot be undone.`
          : 'Delete this wheel? This cannot be undone.'
      }
      confirmLabel="Delete"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
