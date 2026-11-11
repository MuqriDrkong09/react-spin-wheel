import { z } from 'zod';

import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import {
  isAppearanceInput,
  resolveAppearance,
} from '@/features/wheel-customization/utils/appearance';
import {
  CENTER_BUTTON_STYLE,
  SELECTION_MODE,
  WHEEL_SIZE,
  WHEEL_THEME,
  type WheelAppearance,
  type WheelSettings,
} from '@/types/wheel';

import { hexColorSchema } from './primitives';

export const selectionModeSchema = z.enum([
  SELECTION_MODE.manual,
  SELECTION_MODE.automatic,
  SELECTION_MODE.ask,
]);

export const wheelAppearanceSchema: z.ZodType<WheelAppearance> = z.object({
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

/**
 * Persisted wheel settings. Invalid/missing appearance falls back via `resolveAppearance`.
 * Missing selectionMode / removeWinner use domain defaults.
 */
export const wheelSettingsSchema: z.ZodType<WheelSettings> = z.object({
  durationMs: z.number(),
  minRotations: z.number(),
  maxRotations: z.number(),
  soundEnabled: z.boolean(),
  confettiEnabled: z.boolean(),
  eliminationMode: z.boolean(),
  selectionMode: selectionModeSchema.default(SELECTION_MODE.manual),
  removeWinner: z.boolean().default(false),
  skipDisabledItems: z.boolean(),
  appearance: z
    .unknown()
    .optional()
    .transform((value) => resolveAppearance(isAppearanceInput(value) ? value : undefined)),
});

/** Strict settings for export/import wire formats (no soft appearance fallback). */
export const wheelSettingsStrictSchema = z
  .object({
    durationMs: z.number().finite().positive(),
    minRotations: z.number().finite().min(0),
    maxRotations: z.number().finite().min(0),
    soundEnabled: z.boolean(),
    confettiEnabled: z.boolean(),
    eliminationMode: z.boolean(),
    selectionMode: selectionModeSchema,
    removeWinner: z.boolean(),
    skipDisabledItems: z.boolean(),
    appearance: wheelAppearanceSchema,
  })
  .refine((settings) => settings.maxRotations >= settings.minRotations, {
    path: ['maxRotations'],
    message: 'maxRotations must be at least minRotations',
  }) satisfies z.ZodType<WheelSettings>;

export const defaultWheelSettings = (): WheelSettings => ({
  ...DEFAULT_WHEEL_SETTINGS,
  appearance: { ...DEFAULT_WHEEL_SETTINGS.appearance, segmentColors: [...DEFAULT_WHEEL_SETTINGS.appearance.segmentColors] },
});
