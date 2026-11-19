import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import { useEffect } from 'react';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import {
  datasetFormSchema,
  defaultDatasetFormValues,
  type DatasetFormValues,
} from '@/features/test-data-generator/schema';
import { useAppForm } from '@/hooks/useAppForm';

interface CreateDatasetDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: DatasetFormValues) => void;
}

export function CreateDatasetDialog({ open, onClose, onSubmit }: CreateDatasetDialogProps) {
  const form = useAppForm(datasetFormSchema, {
    defaultValues: defaultDatasetFormValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultDatasetFormValues);
    }
  }, [open, form]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" transitionDuration={0}>
      <DialogTitle>{TEST_DATA_MESSAGES.createDatasetTitle}</DialogTitle>
      <Form
        form={form}
        aria-label={TEST_DATA_MESSAGES.createDatasetTitle}
        onSubmit={(values) => {
          onSubmit(values);
          form.reset(defaultDatasetFormValues);
        }}
      >
        <DialogContent>
          <Stack spacing={2}>
            <FormTextField<DatasetFormValues>
              name="name"
              label={TEST_DATA_MESSAGES.datasetName}
              required
              autoFocus
              fullWidth
            />
            <FormTextField<DatasetFormValues>
              name="description"
              label={TEST_DATA_MESSAGES.datasetDescription}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {TEST_DATA_MESSAGES.createDataset}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
