import { z } from 'zod';

import type { PresetItemDefinition, WheelPresetDefinition } from '@/features/presets/types';
import type { WheelPreset } from '@/types/wheel';

import { entityIdSchema, hexColorSchema, isoDateTimeSchema } from './primitives';
import { wheelItemSchema } from './wheelItem';
import { wheelSettingsSchema } from './wheelSettings';

/** Recursive preset catalog item (authoring shape, not a persisted WheelItem). */
export const presetItemDefinitionSchema: z.ZodType<PresetItemDefinition> = z.lazy(() =>
  z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: hexColorSchema.optional(),
    weight: z.number().finite().positive().optional(),
    children: z.array(presetItemDefinitionSchema).optional(),
  }),
);

export const wheelPresetDefinitionSchema: z.ZodType<WheelPresetDefinition> = z.object({
  id: entityIdSchema,
  name: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  icon: z.string().min(1),
  items: z.array(presetItemDefinitionSchema).min(1),
});

export const wheelPresetCatalogSchema = z.array(wheelPresetDefinitionSchema).min(1);

/** Domain WheelPreset (saved preset with full items/settings). */
export const wheelPresetSchema: z.ZodType<WheelPreset> = z.object({
  id: entityIdSchema,
  name: z.string(),
  description: z.string().optional(),
  items: z.array(wheelItemSchema),
  settings: wheelSettingsSchema,
  sourceWheelId: entityIdSchema.optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
