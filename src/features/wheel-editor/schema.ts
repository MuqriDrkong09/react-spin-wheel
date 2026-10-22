import { z } from 'zod';

import { ITEM_COLORS } from '@/constants/wheel';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, EDITOR_MESSAGES.nameRequired).max(100, EDITOR_MESSAGES.nameMax),
  description: z.string().trim(),
  icon: z.string().trim(),
  color: z.string().trim().min(1),
  weight: z.coerce.number().min(1, EDITOR_MESSAGES.weightMin),
  enabled: z.boolean(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const defaultItemFormValues: ItemFormValues = {
  name: '',
  description: '',
  icon: '',
  color: ITEM_COLORS[0] ?? '#4f46e5',
  weight: 1,
  enabled: true,
};
