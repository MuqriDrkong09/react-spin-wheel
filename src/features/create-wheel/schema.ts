import { z } from 'zod';

import { CREATE_WHEEL_MESSAGES } from '@/features/create-wheel/constants';

export const createWheelItemSchema = z.object({
  name: z.string().trim().min(1, CREATE_WHEEL_MESSAGES.optionRequired),
});

export const createWheelFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, CREATE_WHEEL_MESSAGES.nameRequired)
    .min(2, CREATE_WHEEL_MESSAGES.nameMin)
    .max(100, CREATE_WHEEL_MESSAGES.nameMax),
  description: z.string().trim(),
  category: z.string().trim(),
  icon: z.string().trim(),
  items: z.array(createWheelItemSchema).min(1, CREATE_WHEEL_MESSAGES.itemsRequired),
});

export type CreateWheelFormValues = z.infer<typeof createWheelFormSchema>;

export const defaultCreateWheelValues: CreateWheelFormValues = {
  name: '',
  description: '',
  category: '',
  icon: '',
  items: [{ name: '' }],
};
