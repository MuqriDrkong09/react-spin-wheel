import { Button, Stack } from '@mui/material';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import {
  defaultValueFormValues,
  valueFormSchema,
  type ValueFormValues,
} from '@/features/test-data-generator/schema';
import { useAppForm } from '@/hooks/useAppForm';

interface AddValueFormProps {
  fieldName: string;
  optional: boolean;
  onSubmit: (values: ValueFormValues) => void;
}

export function AddValueForm({ fieldName, optional, onSubmit }: AddValueFormProps) {
  const form = useAppForm(valueFormSchema, {
    defaultValues: { ...defaultValueFormValues, optional },
  });

  const label = optional ? TEST_DATA_MESSAGES.addOptionalChild : TEST_DATA_MESSAGES.addChild;

  return (
    <Form
      form={form}
      aria-label={`${label} for ${fieldName}`}
      onSubmit={(values) => {
        onSubmit({ ...values, optional });
        form.reset({ ...defaultValueFormValues, optional });
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'flex-start' } }}>
        <FormTextField<ValueFormValues>
          name="name"
          label={TEST_DATA_MESSAGES.childName}
          required
          fullWidth
        />
        <FormTextField<ValueFormValues>
          name="weight"
          label={TEST_DATA_MESSAGES.weight}
          type="number"
          required
          sx={{ minWidth: { sm: 110 } }}
          slotProps={{ htmlInput: { min: 1, step: 'any' } }}
        />
        <Button type="submit" variant="outlined" sx={{ flexShrink: 0 }}>
          {label}
        </Button>
      </Stack>
    </Form>
  );
}
