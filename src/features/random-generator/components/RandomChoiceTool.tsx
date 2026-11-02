import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Button, Card, CardContent, FormHelperText, IconButton, MenuItem, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useFieldArray, type FieldPath } from 'react-hook-form';

import { Form } from '@/components/common/Form';
import { FormTextField } from '@/components/common/FormTextField';
import { GeneratorResultCard } from '@/features/random-generator/components/GeneratorResult';
import {
  CHOICE_PRESET,
  CHOICE_PRESETS,
  GENERATOR_MESSAGES,
} from '@/features/random-generator/constants';
import {
  defaultRandomChoiceValues,
  randomChoiceFormSchema,
  type RandomChoiceFormValues,
} from '@/features/random-generator/schema';
import {
  generateRandomChoice,
  resolveChoiceOptions,
} from '@/features/random-generator/utils/generateRandomChoice';
import { useAppForm } from '@/hooks/useAppForm';

export function RandomChoiceTool() {
  const form = useAppForm(randomChoiceFormSchema, {
    defaultValues: defaultRandomChoiceValues,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'options' });
  const [values, setValues] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preset = form.watch('preset');
  const optionsError =
    form.formState.errors.options?.message ?? form.formState.errors.options?.root?.message;

  return (
    <Card variant="outlined">
      <CardContent>
        <Form
          form={form}
          aria-label={GENERATOR_MESSAGES.choiceTab}
          onSubmit={(input) => {
            const result = generateRandomChoice(
              resolveChoiceOptions(input.preset, input.options),
              Math.random,
            );
            if (!result.ok) {
              setValues(null);
              setError(result.error);
              return;
            }

            setError(null);
            setValues([result.value]);
          }}
        >
          <Stack spacing={2.5}>
            <Typography color="text.secondary">{GENERATOR_MESSAGES.choiceHint}</Typography>
            <FormTextField<RandomChoiceFormValues>
              name="preset"
              label={GENERATOR_MESSAGES.choicePresetLabel}
              select
              fullWidth
            >
              <MenuItem value={CHOICE_PRESET.yesNo}>{CHOICE_PRESETS.yesNo.label}</MenuItem>
              <MenuItem value={CHOICE_PRESET.headsTails}>{CHOICE_PRESETS.headsTails.label}</MenuItem>
              <MenuItem value={CHOICE_PRESET.trueFalse}>{CHOICE_PRESETS.trueFalse.label}</MenuItem>
              <MenuItem value={CHOICE_PRESET.custom}>{GENERATOR_MESSAGES.customListLabel}</MenuItem>
            </FormTextField>
            {preset === CHOICE_PRESET.custom ? (
              <>
                {optionsError ? (
                  <FormHelperText error sx={{ mx: 0 }}>
                    {optionsError}
                  </FormHelperText>
                ) : null}
                <Stack spacing={1.5}>
                  {fields.map((field, index) => (
                    <Stack key={field.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                      <FormTextField<RandomChoiceFormValues>
                        name={`options.${index}.name` as FieldPath<RandomChoiceFormValues>}
                        label={GENERATOR_MESSAGES.choiceOptionLabel(index + 1)}
                        required
                        fullWidth
                        slotProps={{
                          htmlInput: {
                            'aria-label': GENERATOR_MESSAGES.choiceOptionLabel(index + 1),
                          },
                        }}
                      />
                      <IconButton
                        aria-label={GENERATOR_MESSAGES.removeChoice(index + 1)}
                        onClick={() => remove(index)}
                        disabled={fields.length <= 2}
                        sx={{ mt: 0.5 }}
                      >
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
                <Button startIcon={<AddIcon />} onClick={() => append({ name: '' })}>
                  {GENERATOR_MESSAGES.addChoice}
                </Button>
              </>
            ) : (
              <Typography color="text.secondary">
                {resolveChoiceOptions(preset, []).join(' · ')}
              </Typography>
            )}
            <GeneratorResultCard values={values} error={error} />
            <Button type="submit" variant="contained">
              {values ? GENERATOR_MESSAGES.generateAgain : GENERATOR_MESSAGES.generateChoice}
            </Button>
          </Stack>
        </Form>
      </CardContent>
    </Card>
  );
}
