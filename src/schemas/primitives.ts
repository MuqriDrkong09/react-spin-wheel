import { z } from 'zod';

import type { EntityId, HexColor, IsoDateTime } from '@/types/wheel';

/** Runtime hex color check — compile-time type remains `HexColor` in `@/types/wheel`. */
export const hexColorSchema = z.custom<HexColor>(
  (value) => typeof value === 'string' && /^#[0-9A-Fa-f]{3,8}$/.test(value),
);

export const entityIdSchema = z.string().min(1) as z.ZodType<EntityId>;

export const isoDateTimeSchema = z.string().min(1) as z.ZodType<IsoDateTime>;
