import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Button, Card, CardContent, FormHelperText, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useFieldArray, type FieldPath } from 'react-hook-form';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { GeneratorResultCard } from '@/features/random-generator/components/GeneratorResult';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import {
  defaultRandomItemValues,
  randomItemFormSchema,
  type RandomItemFormValues,
} from '@/features/random-generator/schema';
import { generateRandomItem } from '@/features/random-generator/utils/generateRandomItem';
import { useAppForm } from '@/hooks/useAppForm';

export function RandomItemTool() {
  const form = useAppForm(randomItemFormSchema, {
    defaultValues: defaultRandomItemValues,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const [values, setValues] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const itemsError = form.formState.errors.items?.message ?? form.formState.errors.items?.root?.message;

  return (
    <Card variant="outlined">
      <CardContent>
        <Form
          form={form}
          aria-label={GENERATOR_MESSAGES.itemTab}
          onSubmit={(input) => {
            const result = generateRandomItem(input.items, Math.random);
            if (!result.ok) {
              setValues(null);
              setError(result.error);
              return;
            }

            setError(null);
            setValues([result.value.name]);
          }}
        >
          <Stack spacing={2.5}>
            <Typography color="text.secondary">{GENERATOR_MESSAGES.itemHint}</Typography>
            {itemsError ? (
              <FormHelperText error sx={{ mx: 0 }}>
                {itemsError}
              </FormHelperText>
            ) : null}
            <Stack spacing={1.5}>
              {fields.map((field, index) => (
                <Stack key={field.id} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <FormTextField<RandomItemFormValues>
                    name={`items.${index}.name` as FieldPath<RandomItemFormValues>}
                    label={GENERATOR_MESSAGES.itemNameLabel(index + 1)}
                    required
                    fullWidth
                    slotProps={{
                      htmlInput: { 'aria-label': GENERATOR_MESSAGES.itemNameLabel(index + 1) },
                    }}
                  />
                  <FormTextField<RandomItemFormValues>
                    name={`items.${index}.weight` as FieldPath<RandomItemFormValues>}
                    label={GENERATOR_MESSAGES.weightLabel(index + 1)}
                    type="number"
                    required
                    sx={{ minWidth: { sm: 140 } }}
                    slotProps={{
                      htmlInput: {
                        min: 1,
                        step: 'any',
                        'aria-label': GENERATOR_MESSAGES.weightLabel(index + 1),
                      },
                    }}
                  />
                  <IconButton
                    aria-label={GENERATOR_MESSAGES.removeItem(index + 1)}
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    sx={{ mt: { sm: 0.5 } }}
                  >
                    <DeleteOutlinedIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
            <Button startIcon={<AddIcon />} onClick={() => append({ name: '', weight: 1 })}>
              {GENERATOR_MESSAGES.addItem}
            </Button>
            <GeneratorResultCard values={values} error={error} />
            <Button type="submit" variant="contained">
              {values ? GENERATOR_MESSAGES.generateAgain : GENERATOR_MESSAGES.generateItem}
            </Button>
          </Stack>
        </Form>
      </CardContent>
    </Card>
  );
}
