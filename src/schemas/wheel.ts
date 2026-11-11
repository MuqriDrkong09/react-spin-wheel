import { z } from 'zod';

import {
  ITEM_CONDITION_KIND,
  type ItemCondition,
  type Wheel,
  type WheelSnapshot,
} from '@/types/wheel';

import { entityIdSchema, isoDateTimeSchema } from './primitives';
import { softArraySchema } from './soft';
import { wheelItemSchema } from './wheelItem';
import { wheelSettingsSchema } from './wheelSettings';

export const itemConditionSchema = z.discriminatedUnion('kind', [
  z.object({
    id: entityIdSchema,
    itemId: entityIdSchema,
    kind: z.literal(ITEM_CONDITION_KIND.always),
  }),
  z.object({
    id: entityIdSchema,
    itemId: entityIdSchema,
    kind: z.literal(ITEM_CONDITION_KIND.requiresSelectedItem),
    requiredItemId: entityIdSchema,
  }),
  z.object({
    id: entityIdSchema,
    itemId: entityIdSchema,
    kind: z.literal(ITEM_CONDITION_KIND.maxWins),
    limit: z.number(),
  }),
  z.object({
    id: entityIdSchema,
    itemId: entityIdSchema,
    kind: z.literal(ITEM_CONDITION_KIND.minWeight),
    minWeight: z.number(),
  }),
]) satisfies z.ZodType<ItemCondition>;

export const wheelSchema: z.ZodType<Wheel> = z.object({
  id: entityIdSchema,
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  items: softArraySchema(wheelItemSchema),
  settings: wheelSettingsSchema,
  conditions: softArraySchema(itemConditionSchema).optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const wheelSnapshotSchema: z.ZodType<WheelSnapshot> = z.object({
  items: softArraySchema(wheelItemSchema),
  settings: wheelSettingsSchema,
  conditions: softArraySchema(itemConditionSchema).optional(),
});
