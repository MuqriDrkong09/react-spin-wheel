import { z } from 'zod';

import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import type { WheelImportDocument, WheelImportItem } from '@/features/wheel-import/types';
import {
  CENTER_BUTTON_STYLE,
  SELECTION_MODE,
  WHEEL_SIZE,
  WHEEL_THEME,
} from '@/types/wheel';

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

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

const appearanceSchema = z.object({
  title: z.string(),
  size: z.enum([WHEEL_SIZE.sm, WHEEL_SIZE.md, WHEEL_SIZE.lg]),
  theme: z.enum([
    WHEEL_THEME.classic,
    WHEEL_THEME.neon,
    WHEEL_THEME.pastel,
    WHEEL_THEME.minimal,
    WHEEL_THEME.dark,
    WHEEL_THEME.rainbow,
    WHEEL_THEME.custom,
  ]),
  segmentColors: z.array(hexColorSchema).min(1),
  textColor: hexColorSchema,
  pointerColor: hexColorSchema,
  borderWidth: z.number().finite().min(0),
  borderColor: hexColorSchema,
  fontSize: z.number().finite().positive(),
  fontWeight: z.union([z.literal(400), z.literal(600), z.literal(700)]),
  background: hexColorSchema,
  centerButtonStyle: z.enum([
    CENTER_BUTTON_STYLE.filled,
    CENTER_BUTTON_STYLE.outlined,
    CENTER_BUTTON_STYLE.ghost,
  ]),
  centerButtonColor: hexColorSchema,
  centerButtonTextColor: hexColorSchema,
});

const settingsSchema = z
  .object({
    durationMs: z.number().finite().positive(),
    minRotations: z.number().finite().min(0),
    maxRotations: z.number().finite().min(0),
    soundEnabled: z.boolean(),
    confettiEnabled: z.boolean(),
    eliminationMode: z.boolean(),
    selectionMode: z.enum([SELECTION_MODE.manual, SELECTION_MODE.automatic, SELECTION_MODE.ask]),
    removeWinner: z.boolean(),
    skipDisabledItems: z.boolean(),
    appearance: appearanceSchema,
  })
  .refine((settings) => settings.maxRotations >= settings.minRotations, {
    path: ['maxRotations'],
    message: 'maxRotations must be at least minRotations',
  });

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
    settings: settingsSchema,
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
