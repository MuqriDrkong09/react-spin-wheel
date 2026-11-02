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
import { Controller } from 'react-hook-form';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { GeneratorResultCard } from '@/features/random-generator/components/GeneratorResult';
import { GENERATOR_MESSAGES, NUMBER_MODE } from '@/features/random-generator/constants';
import {
  defaultRandomNumberValues,
  randomNumberFormSchema,
  type RandomNumberFormValues,
} from '@/features/random-generator/schema';
import {
  formatRandomNumber,
  generateRandomNumber,
} from '@/features/random-generator/utils/generateRandomNumber';
import { useAppForm } from '@/hooks/useAppForm';
import { useState } from 'react';

export function RandomNumberTool() {
  const form = useAppForm(randomNumberFormSchema, {
    defaultValues: defaultRandomNumberValues,
  });
  const [values, setValues] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mode = form.watch('mode');

  return (
    <Card variant="outlined">
      <CardContent>
        <Form
          form={form}
          aria-label={GENERATOR_MESSAGES.numberTab}
          onSubmit={(input) => {
            const result = generateRandomNumber(input, Math.random);
            if (!result.ok) {
              setValues(null);
              setError(result.error);
              return;
            }

            setError(null);
            setValues([formatRandomNumber(result.value, input.mode, input.decimals)]);
          }}
        >
          <Stack spacing={2.5}>
            <Typography color="text.secondary">{GENERATOR_MESSAGES.numberHint}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormTextField<RandomNumberFormValues>
                name="min"
                label={GENERATOR_MESSAGES.minLabel}
                type="number"
                required
                fullWidth
                slotProps={{ htmlInput: { 'aria-label': GENERATOR_MESSAGES.minLabel } }}
              />
              <FormTextField<RandomNumberFormValues>
                name="max"
                label={GENERATOR_MESSAGES.maxLabel}
                type="number"
                required
                fullWidth
                slotProps={{ htmlInput: { 'aria-label': GENERATOR_MESSAGES.maxLabel } }}
              />
            </Stack>
            <Controller
              name="mode"
              control={form.control}
              render={({ field }) => (
                <FormControl>
                  <FormLabel id="number-type-label">{GENERATOR_MESSAGES.numberTypeLabel}</FormLabel>
                  <RadioGroup row {...field} aria-labelledby="number-type-label">
                    <FormControlLabel
                      value={NUMBER_MODE.integer}
                      control={<Radio />}
                      label={GENERATOR_MESSAGES.integerLabel}
                    />
                    <FormControlLabel
                      value={NUMBER_MODE.decimal}
                      control={<Radio />}
                      label={GENERATOR_MESSAGES.decimalLabel}
                    />
                  </RadioGroup>
                </FormControl>
              )}
            />
            {mode === NUMBER_MODE.decimal ? (
              <FormTextField<RandomNumberFormValues>
                name="decimals"
                label={GENERATOR_MESSAGES.decimalsLabel}
                type="number"
                required
                sx={{ maxWidth: { sm: 240 } }}
                slotProps={{
                  htmlInput: {
                    min: 0,
                    max: 10,
                    step: 1,
                    'aria-label': GENERATOR_MESSAGES.decimalsLabel,
                  },
                }}
              />
            ) : null}
            <GeneratorResultCard values={values} error={error} />
            <Button type="submit" variant="contained">
              {values ? GENERATOR_MESSAGES.generateAgain : GENERATOR_MESSAGES.generateNumber}
            </Button>
          </Stack>
        </Form>
      </CardContent>
    </Card>
  );
}
