import {
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import type { ZodType } from 'zod';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { ITEM_COLORS } from '@/constants/wheel';
import { ItemCustomFieldsDetails } from '@/features/wheel-editor/components/ItemCustomFieldsDetails';
import { ItemCustomFieldsInputs } from '@/features/wheel-editor/components/ItemCustomFieldsInputs';
import { CUSTOM_FIELD_MESSAGES } from '@/features/wheel-editor/constants/customFields';
import {
  defaultItemFormValues,
  itemFormSchema,
  withCustomFieldValidation,
  type ItemFormValues,
} from '@/features/wheel-editor/schema';
import { useAppForm } from '@/hooks/useAppForm';
import type { CustomFieldDefinition } from '@/types/customFields';

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
  fieldDefinitions?: readonly CustomFieldDefinition[];
  showDetailsPreview?: boolean;
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
  fieldDefinitions = [],
  showDetailsPreview = false,
}: ItemFormProps) {
  const activeSchema = useMemo(
    () => withCustomFieldValidation(schema, fieldDefinitions),
    [fieldDefinitions, schema],
  );
  const form = useAppForm(activeSchema, { defaultValues });

  const handleSubmit = (values: ItemFormValues) => {
    onSubmit(values);

    if (resetOnSubmit) {
      form.reset({
        ...defaultItemFormValues,
        customFields: defaultValues.customFields ?? {},
        color: defaultValues.color,
      });
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
                />
              }
              label="Enabled"
            />
          )}
        />

        {fieldDefinitions.length > 0 ? (
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" component="h3">
              {CUSTOM_FIELD_MESSAGES.detailsHeading}
            </Typography>
            <ItemCustomFieldsInputs definitions={fieldDefinitions} />
            {form.formState.errors.customFields?.message ? (
              <Typography color="error" variant="body2">
                {form.formState.errors.customFields.message}
              </Typography>
            ) : null}
            {showDetailsPreview ? (
              <ItemCustomFieldsDetails
                definitions={fieldDefinitions}
                values={form.watch('customFields')}
              />
            ) : null}
          </Stack>
        ) : null}

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
