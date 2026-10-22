import { Button, Card, CardContent, MenuItem, Stack } from '@mui/material';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { WHEEL_CATEGORIES } from '@/constants/wheel';
import { InitialOptionsField } from '@/features/create-wheel/components/InitialOptionsField';
import { WHEEL_ICON_OPTIONS } from '@/features/create-wheel/constants';
import {
  createWheelFormSchema,
  defaultCreateWheelValues,
  type CreateWheelFormValues,
} from '@/features/create-wheel/schema';
import { useAppForm } from '@/hooks/useAppForm';

interface CreateWheelFormProps {
  onSubmit: (values: CreateWheelFormValues) => void;
  onCancel: () => void;
}

export function CreateWheelForm({ onSubmit, onCancel }: CreateWheelFormProps) {
  const form = useAppForm(createWheelFormSchema, {
    defaultValues: defaultCreateWheelValues,
  });

  return (
    <Card variant="outlined" sx={{ maxWidth: 640 }}>
      <CardContent>
        <Form form={form} onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <FormTextField<CreateWheelFormValues>
              name="name"
              label="Wheel name"
              autoFocus
              required
              fullWidth
            />
            <FormTextField<CreateWheelFormValues>
              name="description"
              label="Description"
              fullWidth
              multiline
              minRows={2}
            />
            <FormTextField<CreateWheelFormValues>
              name="category"
              label="Category"
              select
              fullWidth
              slotProps={{
                select: { displayEmpty: true },
                inputLabel: { shrink: true },
              }}
            >
              <MenuItem value="">None</MenuItem>
              {WHEEL_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </FormTextField>
            <FormTextField<CreateWheelFormValues>
              name="icon"
              label="Icon"
              select
              fullWidth
              slotProps={{
                select: { displayEmpty: true },
                inputLabel: { shrink: true },
              }}
            >
              {WHEEL_ICON_OPTIONS.map((icon) => (
                <MenuItem key={icon.value || 'none'} value={icon.value}>
                  {icon.value ? `${icon.value} ${icon.label}` : icon.label}
                </MenuItem>
              ))}
            </FormTextField>
            <InitialOptionsField />
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="submit" variant="contained">
                Create wheel
              </Button>
            </Stack>
          </Stack>
        </Form>
      </CardContent>
    </Card>
  );
}
