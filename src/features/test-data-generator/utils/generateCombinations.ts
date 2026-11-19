import {
  OMIT_FIELD_ID,
  TEST_DATA_LIMITS,
  TEST_DATA_MESSAGES,
} from '@/features/test-data-generator/constants';
import type {
  GenerateCombinationsInput,
  GenerateCombinationsResult,
  GeneratedCombination,
  TestField,
  TestValue,
} from '@/features/test-data-generator/types';
import { selectWeightedItem } from '@/utils/selectWeightedItem';

interface OmitCandidate {
  id: typeof OMIT_FIELD_ID;
  name: string;
  weight: number;
  enabled: boolean;
}

type FieldCandidate = TestValue | OmitCandidate;

function enabledFields(fields: readonly TestField[]): TestField[] {
  return fields.filter((field) => field.enabled);
}

function enabledValues(values: readonly TestValue[]): TestValue[] {
  return values.filter((value) => value.enabled && value.weight > 0);
}

function combinationKey(row: GeneratedCombination): string {
  return Object.keys(row)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => `${key}:${row[key] ?? ''}`)
    .join('|');
}

export function pickFieldValue(
  field: TestField,
  random: () => number,
): { omitted: true } | { omitted: false; value: TestValue } | undefined {
  const values = enabledValues(field.values);
  if (values.length === 0) {
    return undefined;
  }

  const candidates: FieldCandidate[] = field.optional
    ? [
        {
          id: OMIT_FIELD_ID,
          name: OMIT_FIELD_ID,
          weight: TEST_DATA_LIMITS.omitTokenWeight,
          enabled: true,
        },
        ...values,
      ]
    : values;

  const picked = selectWeightedItem(candidates, random);
  if (!picked) {
    return undefined;
  }

  if (picked.id === OMIT_FIELD_ID) {
    return { omitted: true };
  }

  return { omitted: false, value: picked as TestValue };
}

export function generateOneCombination(
  fields: readonly TestField[],
  random: () => number = Math.random,
): GeneratedCombination | undefined {
  const active = enabledFields(fields);
  if (active.length === 0) {
    return undefined;
  }

  const row: GeneratedCombination = {};
  let included = 0;

  for (const field of active) {
    const picked = pickFieldValue(field, random);
    if (!picked) {
      return undefined;
    }

    if (picked.omitted) {
      continue;
    }

    row[field.name] = picked.value.name;
    included += 1;
  }

  // All-optional datasets may produce an empty row; treat that as invalid.
  if (included === 0) {
    return undefined;
  }

  return row;
}

export function generateCombinations(
  input: GenerateCombinationsInput,
): GenerateCombinationsResult {
  const count = Math.floor(input.count);
  if (!Number.isFinite(count) || count < 1 || count > TEST_DATA_LIMITS.maxResults) {
    return { ok: false, error: TEST_DATA_MESSAGES.countInvalid };
  }

  const fields = enabledFields(input.dataset.fields);
  const hasReadyField = fields.some((field) => enabledValues(field.values).length > 0);
  if (!hasReadyField) {
    return { ok: false, error: TEST_DATA_MESSAGES.noEnabledFields };
  }

  const random = input.random ?? Math.random;
  const unique = input.unique !== false;
  const results: GeneratedCombination[] = [];
  const seen = new Set<string>();
  const maxAttempts = unique ? count * 40 : count;

  for (let attempt = 0; attempt < maxAttempts && results.length < count; attempt += 1) {
    const row = generateOneCombination(fields, random);
    if (!row) {
      continue;
    }

    if (unique) {
      const key = combinationKey(row);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
    }

    results.push(row);
  }

  if (results.length === 0) {
    return { ok: false, error: TEST_DATA_MESSAGES.emptyGeneration };
  }

  return { ok: true, value: results };
}
