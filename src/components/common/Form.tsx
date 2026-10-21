import type { FormEvent, ReactNode } from 'react';
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

interface FormProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  children: ReactNode;
  id?: string;
}

export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  id,
}: FormProps<TFieldValues>) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(onSubmit)(event);
  };

  return (
    <FormProvider {...form}>
      <form id={id} onSubmit={handleSubmit} noValidate>
        {children}
      </form>
    </FormProvider>
  );
}
