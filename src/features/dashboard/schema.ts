import { z } from 'zod';

import { DEFAULT_WHEEL_CATEGORY } from '@/features/dashboard/constants';

export const createWheelFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a wheel name'),
  description: z.string().trim(),
  category: z.string().trim().min(1),
});

export type CreateWheelFormValues = z.infer<typeof createWheelFormSchema>;

export const defaultCreateWheelValues: CreateWheelFormValues = {
  name: '',
  description: '',
  category: DEFAULT_WHEEL_CATEGORY,
};
