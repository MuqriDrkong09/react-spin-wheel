import { z } from 'zod';

import { CUSTOM_FIELD_TYPE, type CustomFieldDefinition, type CustomFieldValue } from '@/types/customFields';

import { entityIdSchema } from './primitives';
import { softArraySchema, softRecordSchema } from './soft';

const customFieldTypeSchema = z.enum([
  CUSTOM_FIELD_TYPE.text,
  CUSTOM_FIELD_TYPE.number,
  CUSTOM_FIELD_TYPE.boolean,
  CUSTOM_FIELD_TYPE.select,
  CUSTOM_FIELD_TYPE.multiSelect,
  CUSTOM_FIELD_TYPE.date,
  CUSTOM_FIELD_TYPE.url,
]);

const fieldKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_]*$/i);

export const customFieldDefinitionSchema: z.ZodType<CustomFieldDefinition> = z
  .object({
    id: entityIdSchema,
    key: fieldKeySchema,
    label: z.string().trim().min(1).max(80),
    type: customFieldTypeSchema,
    options: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    required: z.boolean().optional(),
  })
  .superRefine((definition, context) => {
    const needsOptions =
      definition.type === CUSTOM_FIELD_TYPE.select ||
      definition.type === CUSTOM_FIELD_TYPE.multiSelect;

    if (needsOptions && (!definition.options || definition.options.length === 0)) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Select fields need at least one option',
      });
    }
  });

export const customFieldValueSchema: z.ZodType<CustomFieldValue> = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

/** Keep only definitions that pass validation. */
export const customFieldDefinitionsSchema = softArraySchema(customFieldDefinitionSchema);

/** Keep only values that match the soft value union. */
export const customFieldValuesSchema = softRecordSchema(customFieldValueSchema);

export function emptyCustomFieldValues(): Record<string, CustomFieldValue> {
  return {};
}
