import type { GeneratedCombination, TestField } from '@/features/test-data-generator/types';

/** Join selected values in field order, e.g. `Pizza → Chicken Pepperoni → Large`. */
export function formatCombinationPath(
  row: GeneratedCombination,
  fields: readonly Pick<TestField, 'name' | 'enabled'>[],
): string {
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
    return parts.join(' → ');
  }

  return Object.keys(row)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => row[key])
    .filter((value): value is string => Boolean(value))
    .join(' → ');
}

export function orderedFieldNames(fields: readonly Pick<TestField, 'name' | 'enabled'>[]): string[] {
  return fields.filter((field) => field.enabled).map((field) => field.name);
}
