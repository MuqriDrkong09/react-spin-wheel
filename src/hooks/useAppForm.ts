import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from 'react-hook-form';
import type { ZodType } from 'zod';

type UseAppFormOptions<TValues extends FieldValues> = Omit<UseFormProps<TValues>, 'resolver'>;

export function useAppForm<TValues extends FieldValues>(
  schema: ZodType<TValues, TValues>,
  options?: UseAppFormOptions<TValues>,
): UseFormReturn<TValues> {
  return useForm<TValues>({
    mode: 'onBlur',
    ...options,
    resolver: zodResolver(schema),
  });
}
