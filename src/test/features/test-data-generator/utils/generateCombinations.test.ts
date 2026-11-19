import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import type { TestDataset, TestField, TestValue } from '@/features/test-data-generator/types';
import {
  generateCombinations,
  generateCombinationsBatch,
  generateOneCombination,
  pickFieldValue,
} from '@/features/test-data-generator/utils/generateCombinations';

function value(name: string, extra?: Partial<TestValue>): TestValue {
  return {
    id: name.toLowerCase(),
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

describe('generateCombinations', () => {
  it('picks one child from each required parent field', () => {
    const source = dataset([
      field('Category', [value('Login'), value('Payment')]),
      field('User Type', [value('Admin'), value('Customer')]),
      field('Environment', [value('Development'), value('Staging'), value('Production')]),
    ]);

    const sequence = [0.1, 0.6, 0.9];
    let index = 0;
    const random = () => sequence[index++] ?? 0;

    const row = generateOneCombination(source.fields, random);
    expect(row).toEqual({
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

    const sequence = [0.1, 0];
    let index = 0;
    const random = () => sequence[index++] ?? 0;

    expect(generateOneCombination(source.fields, random)).toEqual({ Category: 'Login' });
  });

  it('exposes omit vs value picks for optional fields', () => {
    const optional = field('Extra', [value('Only')], { optional: true });
    expect(pickFieldValue(optional, () => 0)).toEqual({ omitted: true });
    expect(pickFieldValue(optional, () => 0.9)).toEqual({
      omitted: false,
      value: expect.objectContaining({ name: 'Only' }),
    });
  });

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
    const keys = new Set(result.value.map((row) => JSON.stringify(row)));
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

    const pending = generateCombinationsBatch({
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

    const result = await pending;
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
});
