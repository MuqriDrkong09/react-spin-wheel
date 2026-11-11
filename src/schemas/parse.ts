import type { PresetItemDefinition, WheelPresetDefinition } from '@/features/presets/types';
import type {
  SpinResult,
  SpinSession,
  Wheel,
  WheelItem,
  WheelPreset,
  WheelSettings,
  WheelSnapshot,
} from '@/types/wheel';

import {
  presetItemDefinitionSchema,
  wheelPresetCatalogSchema,
  wheelPresetDefinitionSchema,
  wheelPresetSchema,
} from './presets';
import { softArraySchema } from './soft';
import { spinResultSchema, spinSessionSchema } from './spin';
import { wheelSchema, wheelSnapshotSchema } from './wheel';
import { wheelItemSchema } from './wheelItem';
import { defaultWheelSettings, wheelSettingsSchema } from './wheelSettings';

export type ParseSuccess<T> = { ok: true; data: T };
export type ParseFailure = { ok: false };
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

function asResult<T>(parsed: { success: true; data: T } | { success: false }): ParseResult<T> {
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false };
}

export function parseWheelItem(value: unknown): ParseResult<WheelItem> {
  return asResult(wheelItemSchema.safeParse(value));
}

export function parseWheelItems(value: unknown): WheelItem[] {
  const parsed = softArraySchema(wheelItemSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function parseWheelSettings(value: unknown): WheelSettings {
  const parsed = wheelSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultWheelSettings();
}

export function parseWheel(value: unknown): ParseResult<Wheel> {
  return asResult(wheelSchema.safeParse(value));
}

export function parseWheels(value: unknown): Wheel[] {
  const parsed = softArraySchema(wheelSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function parseWheelSnapshot(value: unknown): ParseResult<WheelSnapshot> {
  return asResult(wheelSnapshotSchema.safeParse(value));
}

export function parseSpinResult(value: unknown): ParseResult<SpinResult> {
  return asResult(spinResultSchema.safeParse(value));
}

export function parseSpinSession(value: unknown): ParseResult<SpinSession> {
  return asResult(spinSessionSchema.safeParse(value));
}

export function parseSpinHistory(value: unknown): SpinSession[] {
  const parsed = softArraySchema(spinSessionSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function parsePresetItemDefinition(value: unknown): ParseResult<PresetItemDefinition> {
  return asResult(presetItemDefinitionSchema.safeParse(value));
}

export function parseWheelPresetDefinition(value: unknown): ParseResult<WheelPresetDefinition> {
  return asResult(wheelPresetDefinitionSchema.safeParse(value));
}

export function parseWheelPresetCatalog(value: unknown): WheelPresetDefinition[] {
  const parsed = wheelPresetCatalogSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function parseWheelPreset(value: unknown): ParseResult<WheelPreset> {
  return asResult(wheelPresetSchema.safeParse(value));
}
