import {
  TEST_DATA_LIMITS,
  TEST_DATA_MESSAGES,
} from '@/features/test-data-generator/constants';
import type { TestDataset, TestField, TestValue } from '@/features/test-data-generator/types';
import {
  combinationKey,
  generateCombinations,
  generateCombinationsBatch,
  generateOneCombination,
  pickFieldValue,
} from '@/features/test-data-generator/utils/generateCombinations';
import * as selectWeightedItem from '@/utils/selectWeightedItem';

function value(name: string, extra?: Partial<TestValue>): TestValue {
  return {
    id: name.toLowerCase().replaceAll(' ', '-'),
    name,
    weight: 1,
    enabled: true,
    optional: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function field(name: string, values: TestValue[], extra?: Partial<TestField>): TestField {
  return {
    id: name.toLowerCase().replaceAll(' ', '-'),
    name,
    weight: 1,
    enabled: true,
    optional: false,
    values,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function dataset(fields: TestField[]): TestDataset {
  return {
    id: 'ds-1',
    name: 'QA Matrix',
    fields,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function sequenceRandom(sequence: number[]) {
  let index = 0;
  return () => sequence[index++] ?? 0;
}

describe('combinationKey', () => {
  it('builds a stable sorted key for uniqueness checks', () => {
    expect(combinationKey({ Size: 'Large', Category: 'Pizza' })).toBe(
      'Category:Pizza|Size:Large',
    );
    expect(combinationKey({ Category: 'Pizza' })).toBe('Category:Pizza');
    expect(combinationKey({})).toBe('');
    expect(combinationKey({ Category: undefined as unknown as string })).toBe('Category:');
  });
});

describe('pickFieldValue', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns undefined when a field has no enabled positive-weight values', () => {
    expect(
      pickFieldValue(
        field('Category', [
          value('Login', { enabled: false }),
          value('Payment', { weight: 0 }),
          value('Legacy', { weight: -1 }),
        ]),
        () => 0.5,
      ),
    ).toBeUndefined();
  });

  it('picks a required value without an omit option', () => {
    const required = field('Category', [value('Login'), value('Payment')]);
    expect(pickFieldValue(required, () => 0)).toEqual({
      omitted: false,
      value: expect.objectContaining({ name: 'Login' }),
    });
    expect(pickFieldValue(required, () => 0.9)).toEqual({
      omitted: false,
      value: expect.objectContaining({ name: 'Payment' }),
    });
  });

  it('exposes omit vs value picks for optional fields', () => {
    const optional = field('Extra', [value('Only')], { optional: true });
    expect(pickFieldValue(optional, () => 0)).toEqual({ omitted: true });
    expect(pickFieldValue(optional, () => 0.9)).toEqual({
      omitted: false,
      value: expect.objectContaining({ name: 'Only' }),
    });
  });

  it('returns undefined when weighted selection finds no candidate', () => {
    vi.spyOn(selectWeightedItem, 'selectWeightedItem').mockReturnValue(undefined);

    expect(pickFieldValue(field('Category', [value('Login')]), () => 0.5)).toBeUndefined();
  });
});

describe('generateOneCombination', () => {
  it('picks one child from each required parent field', () => {
    const source = dataset([
      field('Category', [value('Login'), value('Payment')]),
      field('User Type', [value('Admin'), value('Customer')]),
      field('Environment', [value('Development'), value('Staging'), value('Production')]),
    ]);

    expect(generateOneCombination(source.fields, sequenceRandom([0.1, 0.6, 0.9]))).toEqual({
      Category: 'Login',
      'User Type': 'Customer',
      Environment: 'Production',
    });
  });

  it('may omit optional parent fields', () => {
    const source = dataset([
      field('Category', [value('Login')]),
      field('Notes', [value('A')], { optional: true }),
    ]);

    expect(generateOneCombination(source.fields, sequenceRandom([0.1, 0]))).toEqual({
      Category: 'Login',
    });
  });

  it('skips disabled parent fields', () => {
    const source = dataset([
      field('Category', [value('Login')]),
      field('Hidden', [value('Secret')], { enabled: false }),
      field('Environment', [value('Staging')]),
    ]);

    expect(generateOneCombination(source.fields, () => 0)).toEqual({
      Category: 'Login',
      Environment: 'Staging',
    });
  });

  it('returns undefined when every field is disabled', () => {
    expect(
      generateOneCombination([field('Category', [value('Login')], { enabled: false })]),
    ).toBeUndefined();
  });

  it('returns undefined when a required field cannot pick a value', () => {
    expect(
      generateOneCombination([
        field('Category', [value('Login')]),
        field('Broken', [value('Nope', { enabled: false })]),
      ]),
    ).toBeUndefined();
  });

  it('returns undefined when all-optional fields omit every value', () => {
    const source = dataset([
      field('Notes', [value('A')], { optional: true }),
      field('Extra', [value('B')], { optional: true }),
    ]);

    expect(generateOneCombination(source.fields, () => 0)).toBeUndefined();
  });

  it('includes an optional field when the omit token is not selected', () => {
    const source = dataset([
      field('Category', [value('Login')]),
      field('Notes', [value('Legacy')], { optional: true }),
    ]);

    expect(generateOneCombination(source.fields, sequenceRandom([0, 0.9]))).toEqual({
      Category: 'Login',
      Notes: 'Legacy',
    });
  });

  it('uses Math.random by default', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const row = generateOneCombination([field('Category', [value('Login'), value('Payment')])]);

    expect(randomSpy).toHaveBeenCalled();
    expect(row).toEqual({ Category: 'Login' });
    randomSpy.mockRestore();
  });

  it('returns undefined for an empty field list', () => {
    expect(generateOneCombination([])).toBeUndefined();
  });
});

describe('generateCombinations', () => {
  it('generates multiple unique combinations', () => {
    const source = dataset([
      field('Category', [value('Login'), value('Payment')]),
      field('User Type', [value('Admin'), value('Customer')]),
    ]);

    const result = generateCombinations({
      dataset: source,
      count: 4,
      unique: true,
      random: Math.random,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(4);
    expect(result.uniqueExhausted).toBe(false);
    const keys = new Set(result.value.map((row) => combinationKey(row)));
    expect(keys.size).toBe(4);
  });

  it('allows duplicate combinations when unique is false', () => {
    const source = dataset([field('Category', [value('Login')])]);
    const result = generateCombinations({
      dataset: source,
      count: 5,
      unique: false,
      random: () => 0,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(5);
    expect(result.value.every((row) => row.Category === 'Login')).toBe(true);
    expect(result.uniqueExhausted).toBe(false);
  });

  it('defaults to unique mode and marks exhaustion when the space is small', () => {
    const source = dataset([field('Category', [value('Login'), value('Payment')])]);
    const result = generateCombinations({
      dataset: source,
      count: 10,
      random: Math.random,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(2);
    expect(result.uniqueExhausted).toBe(true);
  });

  it('returns a clear error when no enabled values exist', () => {
    const source = dataset([field('Category', [value('Login', { enabled: false })])]);
    expect(generateCombinations({ dataset: source, count: 1 })).toEqual({
      ok: false,
      error: TEST_DATA_MESSAGES.noEnabledFields,
    });
  });

  it('rejects invalid result counts', () => {
    const source = dataset([field('Category', [value('Login')])]);
    expect(generateCombinations({ dataset: source, count: 0 })).toEqual({
      ok: false,
      error: TEST_DATA_MESSAGES.countInvalid,
    });
    expect(generateCombinations({ dataset: source, count: -1 })).toEqual({
      ok: false,
      error: TEST_DATA_MESSAGES.countInvalid,
    });
    expect(generateCombinations({ dataset: source, count: Number.NaN })).toEqual({
      ok: false,
      error: TEST_DATA_MESSAGES.countInvalid,
    });
    expect(
      generateCombinations({ dataset: source, count: TEST_DATA_LIMITS.maxResults + 1 }),
    ).toEqual({
      ok: false,
      error: TEST_DATA_MESSAGES.countInvalid,
    });
  });

  it('floors fractional counts before generating', () => {
    const source = dataset([field('Category', [value('Login')])]);
    const result = generateCombinations({
      dataset: source,
      count: 2.9,
      unique: false,
      random: () => 0,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(2);
  });

  it('rejects datasets with no ready fields', () => {
    expect(generateCombinations({ dataset: dataset([]), count: 1 })).toEqual({
      ok: false,
      error: TEST_DATA_MESSAGES.noEnabledFields,
    });
    expect(
      generateCombinations({
        dataset: dataset([field('Category', [value('Login', { weight: 0 })])]),
        count: 1,
      }),
    ).toEqual({
      ok: false,
      error: TEST_DATA_MESSAGES.noEnabledFields,
    });
  });

  it('skips duplicate rows while collecting unique results', () => {
    const source = dataset([field('Category', [value('Login'), value('Payment')])]);
    const result = generateCombinations({
      dataset: source,
      count: 2,
      unique: true,
      random: sequenceRandom([0, 0, 0.9]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toEqual([{ Category: 'Login' }, { Category: 'Payment' }]);
    expect(result.uniqueExhausted).toBe(false);
  });

  it('returns emptyGeneration when no valid rows can be produced', () => {
    const source = dataset([field('Notes', [value('A')], { optional: true })]);
    expect(
      generateCombinations({
        dataset: source,
        count: 3,
        unique: false,
        random: () => 0,
      }),
    ).toEqual({
      ok: false,
      error: TEST_DATA_MESSAGES.emptyGeneration,
    });
  });

  it('accepts the maximum allowed result count', () => {
    const source = dataset([field('Category', [value('Login')])]);
    const result = generateCombinations({
      dataset: source,
      count: TEST_DATA_LIMITS.maxResults,
      unique: false,
      random: () => 0,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(TEST_DATA_LIMITS.maxResults);
  });

  it('uses Math.random when no random function is provided', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const source = dataset([field('Category', [value('Login'), value('Payment')])]);

    const result = generateCombinations({ dataset: source, count: 1, unique: false });

    expect(randomSpy).toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      value: [{ Category: 'Login' }],
      uniqueExhausted: false,
    });
    randomSpy.mockRestore();
  });
});

describe('generateCombinationsBatch', () => {
  it('reports progress and supports cancel', async () => {
    const source = dataset([
      field('Category', [value('Login'), value('Payment')]),
      field('User Type', [value('Admin'), value('Customer')]),
    ]);
    const progress: Array<{ completed: number; total: number }> = [];
    const controller = new AbortController();

    const result = await generateCombinationsBatch({
      dataset: source,
      count: 100,
      unique: false,
      chunkSize: 10,
      signal: controller.signal,
      onProgress: (entry) => {
        progress.push(entry);
        if (entry.completed >= 20) {
          controller.abort();
        }
      },
      random: Math.random,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.cancelled).toBe(true);
    expect(result.value.length).toBeGreaterThan(0);
    expect(result.value.length).toBeLessThan(100);
    expect(progress[0]).toEqual({ completed: 0, total: 100 });
    expect(progress.at(-1)?.completed).toBe(result.value.length);
  });

  it('returns an empty cancelled result when aborted before any rows', async () => {
    const source = dataset([field('Category', [value('Login')])]);
    const controller = new AbortController();
    controller.abort();

    await expect(
      generateCombinationsBatch({
        dataset: source,
        count: 10,
        unique: false,
        signal: controller.signal,
        random: () => 0,
      }),
    ).resolves.toEqual({
      ok: true,
      value: [],
      cancelled: true,
      uniqueExhausted: false,
    });
  });

  it('marks uniqueExhausted when the space is smaller than requested', async () => {
    const source = dataset([field('Category', [value('Login'), value('Payment')])]);
    const result = await generateCombinationsBatch({
      dataset: source,
      count: 10,
      unique: true,
      random: Math.random,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(2);
    expect(result.uniqueExhausted).toBe(true);
    expect(result.cancelled).toBe(false);
  });

  it('fills the requested count when duplicates are allowed', async () => {
    const source = dataset([field('Category', [value('Login')])]);
    const progress: Array<{ completed: number; total: number }> = [];

    const result = await generateCombinationsBatch({
      dataset: source,
      count: 12,
      unique: false,
      chunkSize: 5,
      random: () => 0,
      onProgress: (entry) => progress.push(entry),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(12);
    expect(result.cancelled).toBe(false);
    expect(result.uniqueExhausted).toBe(false);
    expect(progress[0]).toEqual({ completed: 0, total: 12 });
    expect(progress.at(-1)).toEqual({ completed: 12, total: 12 });
  });

  it('propagates validation errors from the sync helper', async () => {
    const source = dataset([field('Category', [value('Login', { enabled: false })])]);
    await expect(
      generateCombinationsBatch({ dataset: source, count: 1 }),
    ).resolves.toEqual({
      ok: false,
      error: TEST_DATA_MESSAGES.noEnabledFields,
    });
  });

  it('returns emptyGeneration when the batch cannot produce any rows', async () => {
    const source = dataset([field('Notes', [value('A')], { optional: true })]);
    await expect(
      generateCombinationsBatch({
        dataset: source,
        count: 5,
        unique: false,
        random: () => 0,
      }),
    ).resolves.toEqual({
      ok: false,
      error: TEST_DATA_MESSAGES.emptyGeneration,
    });
  });

  it('rejects invalid counts in batch mode', async () => {
    const source = dataset([field('Category', [value('Login')])]);
    await expect(
      generateCombinationsBatch({ dataset: source, count: 0 }),
    ).resolves.toEqual({
      ok: false,
      error: TEST_DATA_MESSAGES.countInvalid,
    });
  });

  it('defaults to unique mode and the standard chunk size', async () => {
    const source = dataset([
      field('Category', [value('Login'), value('Payment')]),
      field('User Type', [value('Admin'), value('Customer')]),
    ]);
    const progress: Array<{ completed: number; total: number }> = [];

    const result = await generateCombinationsBatch({
      dataset: source,
      count: 4,
      random: Math.random,
      onProgress: (entry) => progress.push(entry),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(4);
    expect(result.uniqueExhausted).toBe(false);
    expect(result.cancelled).toBe(false);
    expect(progress[0]).toEqual({ completed: 0, total: 4 });
    expect(progress.at(-1)).toEqual({ completed: 4, total: 4 });
  });

  it('treats non-positive chunk sizes as one', async () => {
    const source = dataset([field('Category', [value('Login')])]);
    const result = await generateCombinationsBatch({
      dataset: source,
      count: 3,
      unique: false,
      chunkSize: 0,
      random: () => 0,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(3);
  });

  it('can cancel inside a chunk before the next progress tick', async () => {
    const source = dataset([
      field('Category', [value('Login'), value('Payment')]),
      field('User Type', [value('Admin'), value('Customer')]),
    ]);
    const controller = new AbortController();
    let attempts = 0;

    const result = await generateCombinationsBatch({
      dataset: source,
      count: 50,
      unique: false,
      chunkSize: 20,
      signal: controller.signal,
      random: () => {
        attempts += 1;
        if (attempts >= 3) {
          controller.abort();
        }
        return Math.random();
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.cancelled).toBe(true);
    expect(result.uniqueExhausted).toBe(false);
    expect(result.value.length).toBeLessThan(50);
  });

  it('floors fractional counts in batch mode', async () => {
    const source = dataset([field('Category', [value('Login')])]);
    const result = await generateCombinationsBatch({
      dataset: source,
      count: 3.8,
      unique: false,
      random: () => 0,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(3);
  });

  it('does not mark uniqueExhausted when a partial batch is cancelled', async () => {
    const source = dataset([field('Category', [value('Login'), value('Payment')])]);
    const controller = new AbortController();

    const result = await generateCombinationsBatch({
      dataset: source,
      count: 10,
      unique: true,
      chunkSize: 1,
      signal: controller.signal,
      onProgress: (entry) => {
        if (entry.completed >= 1) {
          controller.abort();
        }
      },
      random: Math.random,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.cancelled).toBe(true);
    expect(result.uniqueExhausted).toBe(false);
    expect(result.value.length).toBeGreaterThan(0);
    expect(result.value.length).toBeLessThan(10);
  });

  it('uses Math.random in batch mode when none is provided', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const source = dataset([field('Category', [value('Login'), value('Payment')])]);

    const result = await generateCombinationsBatch({
      dataset: source,
      count: 1,
      unique: false,
    });

    expect(randomSpy).toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      value: [{ Category: 'Login' }],
      cancelled: false,
      uniqueExhausted: false,
    });
    randomSpy.mockRestore();
  });
});
