import { Alert, Button, FormControlLabel, Stack, Switch, Typography } from '@mui/material';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import {
  defaultGenerateFormValues,
  generateFormSchema,
  type GenerateFormValues,
} from '@/features/test-data-generator/schema';
import { useAppForm } from '@/hooks/useAppForm';

interface GeneratePanelProps {
  error: string | null;
  onGenerateOne: () => void;
  onGenerateMultiple: (count: number, unique: boolean) => void;
}

export function GeneratePanel({ error, onGenerateOne, onGenerateMultiple }: GeneratePanelProps) {
  const form = useAppForm(generateFormSchema, {
    defaultValues: defaultGenerateFormValues,
  });

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        {TEST_DATA_MESSAGES.generateTitle}
      </Typography>
      <Typography color="text.secondary">{TEST_DATA_MESSAGES.generateHint}</Typography>
      {error ? (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      ) : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button variant="contained" onClick={onGenerateOne}>
          {TEST_DATA_MESSAGES.generateOne}
        </Button>
      </Stack>
      <Form
        form={form}
        aria-label={TEST_DATA_MESSAGES.generateMultiple}
        onSubmit={(values) => onGenerateMultiple(values.count, values.unique)}
      >
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
            <FormTextField<GenerateFormValues>
              name="count"
              label={TEST_DATA_MESSAGES.resultCount}
              type="number"
              required
              sx={{ maxWidth: { sm: 200 } }}
              slotProps={{ htmlInput: { min: 1, max: 100, step: 1 } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.watch('unique')}
                  onChange={(_, checked) => form.setValue('unique', checked)}
                  slotProps={{ input: { 'aria-label': TEST_DATA_MESSAGES.uniqueResults } }}
                />
              }
              label={TEST_DATA_MESSAGES.uniqueResults}
            />
          </Stack>
          <Button type="submit" variant="outlined">
            {TEST_DATA_MESSAGES.generateMultiple}
          </Button>
        </Stack>
      </Form>
    </Stack>
  );
}
