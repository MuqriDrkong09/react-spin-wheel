import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack } from '@mui/material';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { ITEM_COLORS } from '@/constants/wheel';
import {
  itemFormSchema,
  type ItemFormValues,
} from '@/features/wheel-editor/schema';
import { useAppForm } from '@/hooks/useAppForm';

interface ItemFormDialogProps {
  open: boolean;
  title: string;
  submitLabel: string;
  showColor: boolean;
  defaultValues: ItemFormValues;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => void;
}

export function ItemFormDialog({
  open,
  title,
  submitLabel,
  showColor,
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
      <ItemForm
        key={`${title}-${defaultValues.name}-${defaultValues.color}`}
        submitLabel={submitLabel}
        showColor={showColor}
        defaultValues={defaultValues}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}

interface ItemFormProps {
  submitLabel: string;
  showColor: boolean;
  defaultValues: ItemFormValues;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => void;
}

function ItemForm({ submitLabel, showColor, defaultValues, onClose, onSubmit }: ItemFormProps) {
  const form = useAppForm(itemFormSchema, { defaultValues });

  return (
    <Form form={form} onSubmit={onSubmit}>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <FormTextField<ItemFormValues> name="name" label="Name" autoFocus required fullWidth />
          <FormTextField<ItemFormValues>
            name="icon"
            label="Icon"
            placeholder="🍕"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormTextField<ItemFormValues>
            name="description"
            label="Description"
            fullWidth
            multiline
            minRows={2}
          />
          {showColor ? (
            <FormTextField<ItemFormValues>
              name="color"
              label="Color"
              select
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            >
              {ITEM_COLORS.map((color) => (
                <MenuItem key={color} value={color}>
                  {color}
                </MenuItem>
              ))}
            </FormTextField>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained">
          {submitLabel}
        </Button>
      </DialogActions>
    </Form>
  );
}
