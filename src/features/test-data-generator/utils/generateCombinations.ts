import {
  OMIT_FIELD_ID,
  TEST_DATA_LIMITS,
  TEST_DATA_MESSAGES,
} from '@/features/test-data-generator/constants';
import type {
  BatchGenerateInput,
  BatchGenerateResult,
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

export function combinationKey(row: GeneratedCombination): string {
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

function validateGenerateInput(
  input: GenerateCombinationsInput,
): { ok: true; fields: TestField[]; count: number } | { ok: false; error: string } {
  const count = Math.floor(input.count);
  if (!Number.isFinite(count) || count < 1 || count > TEST_DATA_LIMITS.maxResults) {
    return { ok: false, error: TEST_DATA_MESSAGES.countInvalid };
  }

  const fields = enabledFields(input.dataset.fields);
  const hasReadyField = fields.some((field) => enabledValues(field.values).length > 0);
  if (!hasReadyField) {
    return { ok: false, error: TEST_DATA_MESSAGES.noEnabledFields };
  }

  return { ok: true, fields, count };
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** Synchronous batch helper (small counts / tests). */
export function generateCombinations(
  input: GenerateCombinationsInput,
): GenerateCombinationsResult {
  const validated = validateGenerateInput(input);
  if (!validated.ok) {
    return validated;
  }

  const { fields, count } = validated;
  const random = input.random ?? Math.random;
  const unique = input.unique !== false;
  const results: GeneratedCombination[] = [];
  const seen = new Set<string>();
  const maxAttempts = unique ? Math.max(count * 40, count) : count;
  let uniqueExhausted = false;

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

  if (unique && results.length < count) {
    uniqueExhausted = true;
  }

  return { ok: true, value: results, uniqueExhausted };
}

/**
 * Async chunked generation with progress + cancel.
 * Kept UI-agnostic: pass `onProgress` and optional `AbortSignal`.
 */
export async function generateCombinationsBatch(
  input: BatchGenerateInput,
): Promise<BatchGenerateResult> {
  const validated = validateGenerateInput(input);
  if (!validated.ok) {
    return validated;
  }

  const { fields, count } = validated;
  const random = input.random ?? Math.random;
  const unique = input.unique !== false;
  const chunkSize = Math.max(1, input.chunkSize ?? TEST_DATA_LIMITS.batchChunkSize);
  const results: GeneratedCombination[] = [];
  const seen = new Set<string>();
  const maxAttempts = unique ? Math.max(count * 40, count) : count;
  let attempts = 0;
  let uniqueExhausted = false;
  let cancelled = false;

  input.onProgress?.({ completed: 0, total: count });

  while (results.length < count && attempts < maxAttempts) {
    if (input.signal?.aborted) {
      cancelled = true;
      break;
    }

    const chunkTarget = Math.min(chunkSize, count - results.length);
    let produced = 0;
    let stallGuard = 0;

    while (produced < chunkTarget && attempts < maxAttempts && stallGuard < chunkSize * 20) {
      if (input.signal?.aborted) {
        cancelled = true;
        break;
      }

      attempts += 1;
      stallGuard += 1;
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
      produced += 1;
    }

    input.onProgress?.({ completed: results.length, total: count });

    if (cancelled) {
      break;
    }

    if (produced === 0) {
      // Unique space exhausted or dataset cannot produce more rows.
      uniqueExhausted = unique;
      break;
    }

    if (results.length < count && attempts < maxAttempts) {
      await yieldToMain();
    }
  }

  if (results.length === 0) {
    if (cancelled) {
      return { ok: true, value: [], cancelled: true, uniqueExhausted: false };
    }
    return { ok: false, error: TEST_DATA_MESSAGES.emptyGeneration };
  }

  if (unique && results.length < count && !cancelled) {
    uniqueExhausted = true;
  }

  return {
    ok: true,
    value: results,
    cancelled,
    uniqueExhausted,
  };
}
