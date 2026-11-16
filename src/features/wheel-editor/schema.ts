import { z } from 'zod';

import { ITEM_COLORS } from '@/constants/wheel';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import type { CustomFieldDefinition, CustomFieldValue } from '@/types/customFields';
import { sanitizeCustomFieldValues } from '@/utils/customFields';

const customFieldFormValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

const itemFields = {
  description: z.string().trim(),
  icon: z.string().trim(),
  color: z.string().trim().min(1),
  weight: z.coerce.number().min(1, EDITOR_MESSAGES.weightMin),
  enabled: z.boolean(),
  customFields: z.record(z.string(), customFieldFormValueSchema).default({}),
};

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, EDITOR_MESSAGES.nameRequired).max(100, EDITOR_MESSAGES.nameMax),
  ...itemFields,
});

export const childItemFormSchema = z.object({
  name: z.string().trim().min(1, EDITOR_MESSAGES.childNameRequired).max(100, EDITOR_MESSAGES.nameMax),
  ...itemFields,
});

/** Attach definition-aware custom field validation to an item form schema. */
export function withCustomFieldValidation(
  schema: z.ZodType<ItemFormValues, ItemFormValues>,
  definitions: readonly CustomFieldDefinition[],
): z.ZodType<ItemFormValues, ItemFormValues> {
  if (definitions.length === 0) {
    return schema;
  }

  return schema.superRefine((values, context) => {
    const result = sanitizeCustomFieldValues(definitions, values.customFields);
    if (!result.ok && result.error) {
      context.addIssue({
        code: 'custom',
        path: ['customFields'],
        message: result.error,
      });
    }
  });
}

export type ItemFormValues = z.infer<typeof itemFormSchema> & {
  customFields: Record<string, CustomFieldValue>;
};

export const defaultItemFormValues: ItemFormValues = {
  name: '',
  description: '',
  icon: '',
  color: ITEM_COLORS[0] ?? '#4f46e5',
  weight: 1,
  enabled: true,
  customFields: {},
};
