import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
} from '@mui/material';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { WHEEL_CATEGORIES } from '@/features/dashboard/constants';
import {
  createWheelFormSchema,
  defaultCreateWheelValues,
  type CreateWheelFormValues,
} from '@/features/dashboard/schema';
import { useAppForm } from '@/hooks/useAppForm';

interface CreateWheelDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateWheelFormValues) => void;
}

export function CreateWheelDialog({ open, onClose, onSubmit }: CreateWheelDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      transitionDuration={0}
      closeAfterTransition={false}
      aria-labelledby="create-wheel-title"
    >
      <DialogTitle id="create-wheel-title">Create wheel</DialogTitle>
      {open ? <CreateWheelDialogForm onClose={onClose} onSubmit={onSubmit} /> : null}
    </Dialog>
  );
}

function CreateWheelDialogForm({ onClose, onSubmit }: Omit<CreateWheelDialogProps, 'open'>) {
  const form = useAppForm(createWheelFormSchema, {
    defaultValues: defaultCreateWheelValues,
  });

  return (
    <Form form={form} onSubmit={onSubmit} id="create-wheel-form">
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormTextField<CreateWheelFormValues>
            name="name"
            label="Name"
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
          <FormTextField<CreateWheelFormValues> name="category" label="Category" select fullWidth>
            {WHEEL_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </FormTextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="create-wheel-form" variant="contained">
          Create
        </Button>
      </DialogActions>
    </Form>
  );
}
