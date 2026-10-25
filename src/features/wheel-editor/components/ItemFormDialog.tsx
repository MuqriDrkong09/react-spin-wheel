import { Dialog, DialogContent, DialogTitle } from '@mui/material';

import { ItemForm } from '@/features/wheel-editor/components/ItemForm';
import type { ItemFormValues } from '@/features/wheel-editor/schema';

interface ItemFormDialogProps {
  open: boolean;
  title: string;
  submitLabel: string;
  defaultValues: ItemFormValues;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => void;
}

export function ItemFormDialog({
  open,
  title,
  submitLabel,
  defaultValues,
  onClose,
  onSubmit,
}: ItemFormDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <Dialog
      open
      onClose={onClose}
      transitionDuration={0}
      closeAfterTransition={false}
      fullWidth
      maxWidth="sm"
      aria-labelledby="item-form-title"
    >
      <DialogTitle id="item-form-title">{title}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <ItemForm
          key={`${title}-${defaultValues.name}-${defaultValues.color}`}
          defaultValues={defaultValues}
          submitLabel={submitLabel}
          ariaLabel={title}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
