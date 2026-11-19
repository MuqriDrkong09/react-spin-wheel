import { z } from 'zod';

import { softArraySchema } from '@/schemas/soft';

const testValueSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  weight: z.number().finite().nonnegative(),
  enabled: z.boolean(),
  optional: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const testFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  weight: z.number().finite().nonnegative(),
  enabled: z.boolean(),
  optional: z.boolean().default(false),
  values: softArraySchema(testValueSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const testDatasetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  fields: softArraySchema(testFieldSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ParsedTestDataset = z.infer<typeof testDatasetSchema>;
