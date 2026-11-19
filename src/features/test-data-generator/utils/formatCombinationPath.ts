import type { GeneratedCombination, TestField } from '@/features/test-data-generator/types';

/** Ordered selected values for a combination (skips omitted optional fields). */
export function combinationPathParts(
  row: GeneratedCombination,
  fields: readonly Pick<TestField, 'name' | 'enabled'>[],
): string[] {
  const parts: string[] = [];
  for (const field of fields) {
    if (!field.enabled) {
      continue;
    }
    const value = row[field.name];
    if (value) {
      parts.push(value);
    }
  }

  if (parts.length > 0) {
    return parts;
  }

  return Object.keys(row)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => row[key])
    .filter((value): value is string => Boolean(value));
}

/** Join selected values in field order, e.g. `Pizza → Chicken Pepperoni → Large`. */
export function formatCombinationPath(
  row: GeneratedCombination,
  fields: readonly Pick<TestField, 'name' | 'enabled'>[],
): string {
  return combinationPathParts(row, fields).join(' → ');
}

export function orderedFieldNames(fields: readonly Pick<TestField, 'name' | 'enabled'>[]): string[] {
  return fields.filter((field) => field.enabled).map((field) => field.name);
}

const SHALLOW_HIERARCHY_HEADERS = ['Parent', 'Child', 'Grandchild'] as const;

/**
 * CSV column headers for a flattened hierarchy path.
 * Depth 1–3: Parent / Child / Grandchild.
 * Depth 4+: Level 1 … Level N.
 */
export function hierarchyCsvHeaders(maxDepth: number): string[] {
  const depth = Math.max(0, Math.floor(maxDepth));
  if (depth === 0) {
    return [];
  }

  if (depth <= SHALLOW_HIERARCHY_HEADERS.length) {
    return SHALLOW_HIERARCHY_HEADERS.slice(0, depth);
  }

  return Array.from({ length: depth }, (_, index) => `Level ${index + 1}`);
}
