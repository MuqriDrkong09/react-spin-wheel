import {
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
} from '@mui/material';
import { Controller } from 'react-hook-form';
import type { ZodType } from 'zod';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { ITEM_COLORS } from '@/constants/wheel';
import {
  defaultItemFormValues,
  itemFormSchema,
  type ItemFormValues,
} from '@/features/wheel-editor/schema';
import { useAppForm } from '@/hooks/useAppForm';

interface ItemFormProps {
  defaultValues?: ItemFormValues;
  submitLabel: string;
  nameLabel?: string;
  onSubmit: (values: ItemFormValues) => void;
  onCancel?: () => void;
  resetOnSubmit?: boolean;
  autoFocus?: boolean;
  formId?: string;
  ariaLabel?: string;
  schema?: ZodType<ItemFormValues, ItemFormValues>;
}

export function ItemForm({
  defaultValues = defaultItemFormValues,
  submitLabel,
  nameLabel = 'Name',
  onSubmit,
  onCancel,
  resetOnSubmit = false,
  autoFocus = true,
  formId,
  ariaLabel,
  schema = itemFormSchema,
}: ItemFormProps) {
  const form = useAppForm(schema, { defaultValues });

  const handleSubmit = (values: ItemFormValues) => {
    onSubmit(values);

    if (resetOnSubmit) {
      form.reset(defaultItemFormValues);
    }
  };

  return (
    <Form form={form} onSubmit={handleSubmit} id={formId} aria-label={ariaLabel}>
      <Stack spacing={2.5}>
        <FormTextField<ItemFormValues>
          name="name"
          label={nameLabel}
          autoFocus={autoFocus}
          required
          fullWidth
        />
        <FormTextField<ItemFormValues>
          name="description"
          label="Description"
          fullWidth
          multiline
          minRows={2}
        />
        <FormTextField<ItemFormValues>
          name="icon"
          label="Icon"
          placeholder="🍕"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
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
        <FormTextField<ItemFormValues>
          name="weight"
          label="Weight"
          type="number"
          required
          fullWidth
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
        <Controller
          name="enabled"
          control={form.control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value}
                  onChange={(_, checked) => field.onChange(checked)}
                  inputRef={field.ref}
                />
              }
              label="Enabled"
            />
          )}
        />
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          {onCancel ? <Button onClick={onCancel}>Cancel</Button> : null}
          <Button type="submit" variant="contained">
            {submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}
