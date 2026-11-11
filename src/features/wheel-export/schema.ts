import { z } from 'zod';

import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import type { WheelExportDocument, WheelExportItem } from '@/features/wheel-export/types';
import { hexColorSchema } from '@/schemas/primitives';
import { wheelSettingsStrictSchema } from '@/schemas/wheelSettings';

export const wheelExportItemSchema: z.ZodType<WheelExportItem> = z.lazy(() =>
  z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(500).optional(),
    icon: z.string().trim().min(1).max(32).optional(),
    color: hexColorSchema,
    enabled: z.boolean(),
    weight: z.number().min(1),
    children: z.array(wheelExportItemSchema).min(1).optional(),
  }),
);

export const wheelExportDocumentSchema: z.ZodType<WheelExportDocument> = z.object({
  format: z.literal(WHEEL_EXPORT_FORMAT),
  version: z.literal(WHEEL_EXPORT_VERSION),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  icon: z.string().trim().min(1).max(32).optional(),
  items: z.array(wheelExportItemSchema).min(1),
  settings: wheelSettingsStrictSchema,
});
