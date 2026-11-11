import { z } from 'zod';

/**
 * Keep only entries that pass `schema`. Non-arrays fail validation so the parent
 * can fall back to defaults; individual bad items are dropped instead of failing the batch.
 */
export function softArraySchema<T>(schema: z.ZodType<T>) {
  return z.array(z.unknown()).transform((items): T[] => {
    const valid: T[] = [];
    for (const item of items) {
      const parsed = schema.safeParse(item);
      if (parsed.success) {
        valid.push(parsed.data);
      }
    }
    return valid;
  });
}

/**
 * Soft record: drop entries whose values fail `schema`.
 * Non-objects fail so the parent can recover.
 */
export function softRecordSchema<T>(schema: z.ZodType<T>) {
  return z.record(z.string(), z.unknown()).transform((record): Record<string, T> => {
    const valid: Record<string, T> = {};
    for (const [key, value] of Object.entries(record)) {
      const parsed = schema.safeParse(value);
      if (parsed.success) {
        valid[key] = parsed.data;
      }
    }
    return valid;
  });
}
