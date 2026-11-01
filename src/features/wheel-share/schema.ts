import { z } from 'zod';

import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { wheelExportDocumentSchema } from '@/features/wheel-export/schema';
import { WHEEL_SHARE_FORMAT, WHEEL_SHARE_VERSION } from '@/features/wheel-share/constants';
import type { WheelShareWheel } from '@/features/wheel-share/types';

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/)
  .refine((value) => !Number.isNaN(Date.parse(value)));

export const wheelShareEnvelopeSchema = z.object({
  format: z.literal(WHEEL_SHARE_FORMAT),
  version: z.literal(WHEEL_SHARE_VERSION),
  createdAt: isoDateSchema,
  expiresAt: isoDateSchema,
  wheel: z.unknown(),
});

export function parseShareWheel(value: unknown): { ok: true; wheel: WheelShareWheel } | { ok: false } {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false };
  }

  const record = value as Record<string, unknown>;
  const result = wheelExportDocumentSchema.safeParse({
    format: WHEEL_EXPORT_FORMAT,
    version: WHEEL_EXPORT_VERSION,
    name: record.name,
    description: record.description,
    category: record.category,
    icon: record.icon,
    items: record.items,
    settings: record.settings,
  });

  if (!result.success) {
    return { ok: false };
  }

  const { format: _format, version: _version, ...wheel } = result.data;
  return { ok: true, wheel };
}
