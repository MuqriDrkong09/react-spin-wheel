import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Box, Button, FormHelperText, IconButton, Stack, Typography } from '@mui/material';
import { useFieldArray, useFormContext, type FieldPath } from 'react-hook-form';

import { FormTextField } from '@/components/common/FormTextField';
import type { CreateWheelFormValues } from '@/features/create-wheel/schema';

export function InitialOptionsField() {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateWheelFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const itemsError = errors.items?.message ?? errors.items?.root?.message;

  return (
    <Box>
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
        Initial options
      </Typography>
      {itemsError ? (
        <FormHelperText error sx={{ mx: 0, mb: 1 }}>
          {itemsError}
        </FormHelperText>
      ) : (
        <Typography color="text.secondary" variant="body2" sx={{ mb: 1.5 }}>
          Add at least one option for the wheel to land on.
        </Typography>
      )}
      <Stack spacing={1.5}>
        {fields.map((field, index) => (
          <Stack key={field.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <FormTextField<CreateWheelFormValues>
              name={`items.${index}.name` as FieldPath<CreateWheelFormValues>}
              label={`Option ${index + 1}`}
              required
              fullWidth
            />
            <IconButton
              aria-label={`Remove option ${index + 1}`}
              onClick={() => remove(index)}
              sx={{ mt: 0.5 }}
            >
              <DeleteOutlinedIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      <Button startIcon={<AddIcon />} onClick={() => append({ name: '' })} sx={{ mt: 1.5 }}>
        Add option
      </Button>
    </Box>
  );
}
