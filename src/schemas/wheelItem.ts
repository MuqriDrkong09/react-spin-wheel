import { z } from 'zod';

import type { WheelItem } from '@/types/wheel';

import { entityIdSchema, hexColorSchema, isoDateTimeSchema } from './primitives';
import { softArraySchema } from './soft';

/**
 * Recursive persisted WheelItem schema.
 * Compile-time shape lives in `@/types/wheel`; this validates unknown storage/import data.
 * Invalid nested children are dropped instead of failing the parent.
 */
export const wheelItemSchema: z.ZodType<WheelItem> = z.lazy(() =>
  z.object({
    id: entityIdSchema,
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: hexColorSchema,
    enabled: z.boolean(),
    weight: z.preprocess(
      (value) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 1),
      z.number(),
    ),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    children: softArraySchema(wheelItemSchema).optional(),
  }),
);
