import { z } from 'zod';

import { ITEM_COLORS } from '@/constants/wheel';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, EDITOR_MESSAGES.nameRequired).max(100, EDITOR_MESSAGES.nameMax),
  icon: z.string().trim(),
  description: z.string().trim(),
  color: z.string().trim().min(1),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const defaultItemFormValues: ItemFormValues = {
  name: '',
  icon: '',
  description: '',
  color: ITEM_COLORS[0] ?? '#4f46e5',
};
