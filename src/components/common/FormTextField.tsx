import { TextField, type TextFieldProps } from '@mui/material';
import { Controller, useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

type FormTextFieldProps<TFieldValues extends FieldValues> = Omit<
  TextFieldProps,
  'name' | 'value' | 'onChange' | 'error'
> & {
  name: FieldPath<TFieldValues>;
};

export function FormTextField<TFieldValues extends FieldValues>({
  name,
  helperText,
  ...props
}: FormTextFieldProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          {...field}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
        />
      )}
    />
  );
}
