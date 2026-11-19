import { Button, FormControlLabel, Stack, Switch } from '@mui/material';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import {
  defaultFieldFormValues,
  fieldFormSchema,
  type FieldFormValues,
} from '@/features/test-data-generator/schema';
import { useAppForm } from '@/hooks/useAppForm';

interface AddFieldFormProps {
  onSubmit: (values: FieldFormValues) => void;
}

export function AddFieldForm({ onSubmit }: AddFieldFormProps) {
  const form = useAppForm(fieldFormSchema, {
    defaultValues: defaultFieldFormValues,
  });

  return (
    <Form
      form={form}
      aria-label={TEST_DATA_MESSAGES.addParent}
      onSubmit={(values) => {
        onSubmit(values);
        form.reset(defaultFieldFormValues);
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormTextField<FieldFormValues>
            name="name"
            label={TEST_DATA_MESSAGES.parentName}
            required
            fullWidth
          />
          <FormTextField<FieldFormValues>
            name="weight"
            label={TEST_DATA_MESSAGES.weight}
            type="number"
            required
            sx={{ minWidth: { sm: 120 } }}
            slotProps={{ htmlInput: { min: 1, step: 'any' } }}
          />
        </Stack>
        <FormControlLabel
          control={
            <Switch
              checked={form.watch('optional')}
              onChange={(_, checked) => form.setValue('optional', checked)}
              slotProps={{ input: { 'aria-label': TEST_DATA_MESSAGES.optionalField } }}
            />
          }
          label={TEST_DATA_MESSAGES.optionalField}
        />
        <Button type="submit" variant="contained">
          {TEST_DATA_MESSAGES.addParent}
        </Button>
      </Stack>
    </Form>
  );
}
