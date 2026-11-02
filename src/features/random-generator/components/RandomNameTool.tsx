import {
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Controller } from 'react-hook-form';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { GeneratorResultCard } from '@/features/random-generator/components/GeneratorResult';
import { GENERATOR_MESSAGES, NAME_STYLE } from '@/features/random-generator/constants';
import {
  defaultRandomNameValues,
  randomNameFormSchema,
  type RandomNameFormValues,
} from '@/features/random-generator/schema';
import { generateRandomName } from '@/features/random-generator/utils/generateRandomName';
import { useAppForm } from '@/hooks/useAppForm';

export function RandomNameTool() {
  const form = useAppForm(randomNameFormSchema, {
    defaultValues: defaultRandomNameValues,
  });
  const [values, setValues] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card variant="outlined">
      <CardContent>
        <Form
          form={form}
          aria-label={GENERATOR_MESSAGES.nameTab}
          onSubmit={(input) => {
            const result = generateRandomName(input, Math.random);
            if (!result.ok) {
              setValues(null);
              setError(result.error);
              return;
            }

            setError(null);
            setValues(result.value);
          }}
        >
          <Stack spacing={2.5}>
            <Typography color="text.secondary">{GENERATOR_MESSAGES.nameHint}</Typography>
            <Controller
              name="style"
              control={form.control}
              render={({ field }) => (
                <FormControl>
                  <FormLabel id="name-style-label">{GENERATOR_MESSAGES.nameStyleLabel}</FormLabel>
                  <RadioGroup row {...field} aria-labelledby="name-style-label">
                    <FormControlLabel
                      value={NAME_STYLE.first}
                      control={<Radio />}
                      label={GENERATOR_MESSAGES.firstNameLabel}
                    />
                    <FormControlLabel
                      value={NAME_STYLE.last}
                      control={<Radio />}
                      label={GENERATOR_MESSAGES.lastNameLabel}
                    />
                    <FormControlLabel
                      value={NAME_STYLE.full}
                      control={<Radio />}
                      label={GENERATOR_MESSAGES.fullNameLabel}
                    />
                  </RadioGroup>
                </FormControl>
              )}
            />
            <FormTextField<RandomNameFormValues>
              name="count"
              label={GENERATOR_MESSAGES.nameCountLabel}
              type="number"
              required
              sx={{ maxWidth: { sm: 240 } }}
              slotProps={{
                htmlInput: {
                  min: 1,
                  max: 20,
                  step: 1,
                  'aria-label': GENERATOR_MESSAGES.nameCountLabel,
                },
              }}
            />
            <GeneratorResultCard values={values} error={error} />
            <Button type="submit" variant="contained">
              {values ? GENERATOR_MESSAGES.generateAgain : GENERATOR_MESSAGES.generateName}
            </Button>
          </Stack>
        </Form>
      </CardContent>
    </Card>
  );
}
