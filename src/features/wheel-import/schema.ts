import { z } from 'zod';

import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import type { WheelImportDocument, WheelImportItem } from '@/features/wheel-import/types';
import { hexColorSchema } from '@/schemas/primitives';
import { wheelSettingsStrictSchema } from '@/schemas/wheelSettings';

export const importedIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export const importWheelNameSchema = z.string().trim().min(1).max(100);

export const wheelImportItemSchema: z.ZodType<WheelImportItem> = z.lazy(() =>
  z.object({
    id: importedIdSchema.optional(),
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(500).optional(),
    icon: z.string().trim().min(1).max(32).optional(),
    color: hexColorSchema,
    enabled: z.boolean(),
    weight: z.number().finite().min(1),
    children: z.array(wheelImportItemSchema).min(1).optional(),
  }),
);

export const wheelImportDocumentSchema: z.ZodType<WheelImportDocument> = z
  .object({
    format: z.literal(WHEEL_EXPORT_FORMAT),
    version: z.literal(WHEEL_EXPORT_VERSION),
    id: importedIdSchema.optional(),
    name: importWheelNameSchema,
    description: z.string().trim().min(1).max(500).optional(),
    category: z.string().trim().min(1).max(80).optional(),
    icon: z.string().trim().min(1).max(32).optional(),
    items: z.array(wheelImportItemSchema).min(1),
    settings: wheelSettingsStrictSchema,
  })
  .superRefine((document, context) => {
    const ids = collectImportedIds(document);
    const seen = new Set<string>();

    for (const id of ids) {
      if (seen.has(id)) {
        context.addIssue({
          code: 'custom',
          path: ['id'],
          message: 'duplicate',
        });
        return;
      }
      seen.add(id);
    }
  });

function collectImportedIds(document: WheelImportDocument): string[] {
  const ids: string[] = [];
  if (document.id) {
    ids.push(document.id);
  }
  collectItemIds(document.items, ids);
  return ids;
}

function collectItemIds(items: readonly WheelImportItem[], ids: string[]): void {
  for (const item of items) {
    if (item.id) {
      ids.push(item.id);
    }
    if (item.children) {
      collectItemIds(item.children, ids);
    }
  }
}
