import { z } from 'zod';

import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import type { WheelExportDocument, WheelExportItem } from '@/features/wheel-export/types';
import {
  CENTER_BUTTON_STYLE,
  SELECTION_MODE,
  WHEEL_SIZE,
  WHEEL_THEME,
} from '@/types/wheel';

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

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
  borderWidth: z.number().min(0),
  borderColor: hexColorSchema,
  fontSize: z.number().positive(),
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
    durationMs: z.number().positive(),
    minRotations: z.number().min(0),
    maxRotations: z.number().min(0),
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

export const wheelExportDocumentSchema: z.ZodType<WheelExportDocument> = z.object({
  format: z.literal(WHEEL_EXPORT_FORMAT),
  version: z.literal(WHEEL_EXPORT_VERSION),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  icon: z.string().trim().min(1).max(32).optional(),
  items: z.array(wheelExportItemSchema).min(1),
  settings: settingsSchema,
});
