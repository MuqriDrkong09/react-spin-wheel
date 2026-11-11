import { z } from 'zod';

import {
  SELECTION_MODE,
  SPIN_SESSION_STATUS,
  type SpinResult,
  type SpinSession,
} from '@/types/wheel';

import { entityIdSchema, isoDateTimeSchema } from './primitives';
import { softArraySchema } from './soft';
import { selectionModeSchema } from './wheelSettings';

/**
 * Persisted spin result. Older payloads may omit selected fields, pathLabels, timestamp, duration, or mode;
 * transforms fill those from legacy fields before returning a full SpinResult.
 */
export const spinResultSchema: z.ZodType<SpinResult> = z
  .object({
    id: entityIdSchema,
    sessionId: entityIdSchema,
    wheelId: entityIdSchema,
    itemId: entityIdSchema,
    itemName: z.string(),
    selectedItemId: entityIdSchema.optional(),
    selectedItemName: z.string().optional(),
    parentItemId: entityIdSchema.nullable(),
    path: z.array(entityIdSchema),
    pathLabels: z.array(z.string()).optional(),
    depth: z.number(),
    probability: z.number(),
    timestamp: isoDateTimeSchema.optional(),
    spunAt: isoDateTimeSchema,
    duration: z.number().optional(),
    mode: selectionModeSchema.optional(),
  })
  .transform((value) => ({
    ...value,
    selectedItemId: value.selectedItemId ?? value.itemId,
    selectedItemName: value.selectedItemName ?? value.itemName,
    pathLabels: value.pathLabels ?? [value.itemName],
    timestamp: value.timestamp ?? value.spunAt,
    duration: value.duration ?? 0,
    mode: value.mode ?? SELECTION_MODE.manual,
  }));

export const spinSessionSchema: z.ZodType<SpinSession> = z.object({
  id: entityIdSchema,
  wheelId: entityIdSchema,
  wheelName: z.string(),
  status: z.enum([
    SPIN_SESSION_STATUS.inProgress,
    SPIN_SESSION_STATUS.completed,
    SPIN_SESSION_STATUS.cancelled,
  ]),
  results: softArraySchema(spinResultSchema),
  path: z.array(entityIdSchema),
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.optional(),
});
