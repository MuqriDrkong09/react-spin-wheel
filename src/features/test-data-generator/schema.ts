import { z } from 'zod';

import { TEST_DATA_LIMITS, TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';

export const datasetFormSchema = z.object({
  name: z.string().trim().min(1, TEST_DATA_MESSAGES.nameRequired),
  description: z.string().trim().optional(),
});

export type DatasetFormValues = z.infer<typeof datasetFormSchema>;

export const defaultDatasetFormValues: DatasetFormValues = {
  name: '',
  description: '',
};

export const fieldFormSchema = z.object({
  name: z.string().trim().min(1, TEST_DATA_MESSAGES.nameRequired),
  weight: z.coerce.number().finite().positive(),
  optional: z.boolean(),
  enabled: z.boolean(),
});

export type FieldFormValues = z.infer<typeof fieldFormSchema>;

export const defaultFieldFormValues: FieldFormValues = {
  name: '',
  weight: 1,
  optional: false,
  enabled: true,
};

export const valueFormSchema = z.object({
  name: z.string().trim().min(1, TEST_DATA_MESSAGES.nameRequired),
  weight: z.coerce.number().finite().positive(),
  optional: z.boolean(),
  enabled: z.boolean(),
});

export type ValueFormValues = z.infer<typeof valueFormSchema>;

export const defaultValueFormValues: ValueFormValues = {
  name: '',
  weight: 1,
  optional: false,
  enabled: true,
};

export const generateFormSchema = z.object({
  count: z.coerce
    .number()
    .int(TEST_DATA_MESSAGES.countInvalid)
    .min(1, TEST_DATA_MESSAGES.countInvalid)
    .max(TEST_DATA_LIMITS.maxResults, TEST_DATA_MESSAGES.countInvalid),
  unique: z.boolean(),
});

export type GenerateFormValues = z.infer<typeof generateFormSchema>;

export const defaultGenerateFormValues: GenerateFormValues = {
  count: 5,
  unique: true,
};
