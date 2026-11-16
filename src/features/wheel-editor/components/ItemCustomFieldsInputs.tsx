import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  MenuItem,
  Stack,
  Switch,
} from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';

import { FormTextField } from '@/components/common/FormTextField';
import type { ItemFormValues } from '@/features/wheel-editor/schema';
import { CUSTOM_FIELD_TYPE, type CustomFieldDefinition } from '@/types/customFields';

interface ItemCustomFieldsInputsProps {
  definitions: readonly CustomFieldDefinition[];
}

export function ItemCustomFieldsInputs({ definitions }: ItemCustomFieldsInputsProps) {
  const { control } = useFormContext<ItemFormValues>();

  if (definitions.length === 0) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {definitions.map((definition) => {
        const name = `customFields.${definition.id}` as const;

        switch (definition.type) {
          case CUSTOM_FIELD_TYPE.boolean:
            return (
              <Controller
                key={definition.id}
                name={name}
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(field.value)}
                        onChange={(_, checked) => field.onChange(checked)}
                      />
                    }
                    label={definition.label}
                  />
                )}
              />
            );
          case CUSTOM_FIELD_TYPE.multiSelect:
            return (
              <Controller
                key={definition.id}
                name={name}
                control={control}
                render={({ field, fieldState }) => {
                  const selected = Array.isArray(field.value) ? field.value : [];
                  return (
                    <FormControl error={Boolean(fieldState.error)} component="fieldset" variant="standard">
                      <FormLabel component="legend">{definition.label}</FormLabel>
                      <FormGroup>
                        {(definition.options ?? []).map((option) => (
                          <FormControlLabel
                            key={option}
                            control={
                              <Checkbox
                                checked={selected.includes(option)}
                                onChange={(_, checked) => {
                                  field.onChange(
                                    checked
                                      ? [...selected, option]
                                      : selected.filter((entry) => entry !== option),
                                  );
                                }}
                              />
                            }
                            label={option}
                          />
                        ))}
                      </FormGroup>
                      {fieldState.error?.message ? (
                        <FormHelperText>{fieldState.error.message}</FormHelperText>
                      ) : null}
                    </FormControl>
                  );
                }}
              />
            );
          case CUSTOM_FIELD_TYPE.select:
            return (
              <FormTextField<ItemFormValues>
                key={definition.id}
                name={name}
                label={definition.label}
                select
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {(definition.options ?? []).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </FormTextField>
            );
          case CUSTOM_FIELD_TYPE.number:
            return (
              <FormTextField<ItemFormValues>
                key={definition.id}
                name={name}
                label={definition.label}
                type="number"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            );
          case CUSTOM_FIELD_TYPE.date:
            return (
              <FormTextField<ItemFormValues>
                key={definition.id}
                name={name}
                label={definition.label}
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            );
          case CUSTOM_FIELD_TYPE.url:
            return (
              <FormTextField<ItemFormValues>
                key={definition.id}
                name={name}
                label={definition.label}
                type="url"
                placeholder="https://"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            );
          case CUSTOM_FIELD_TYPE.text:
          default:
            return (
              <FormTextField<ItemFormValues>
                key={definition.id}
                name={name}
                label={definition.label}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            );
        }
      })}
    </Stack>
  );
}
