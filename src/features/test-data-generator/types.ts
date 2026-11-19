import type { IsoDateTime } from '@/types/wheel';

export type TestDatasetId = string;
export type TestFieldId = string;
export type TestValueId = string;

/** A pickable child value under a parent field. */
export interface TestValue {
  id: TestValueId;
  name: string;
  weight: number;
  enabled: boolean;
  /** Optional values are still pickable; they are labeled for test authors. */
  optional: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** A parent dimension (e.g. Category, User Type, Environment). */
export interface TestField {
  id: TestFieldId;
  name: string;
  weight: number;
  enabled: boolean;
  /**
   * When true, a generated row may omit this field entirely
   * (weighted against its child values).
   */
  optional: boolean;
  values: TestValue[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface TestDataset {
  id: TestDatasetId;
  name: string;
  description?: string;
  fields: TestField[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** One generated combination: field name → selected value name. */
export type GeneratedCombination = Record<string, string>;

export interface GenerateCombinationsInput {
  dataset: TestDataset;
  count: number;
  /** Prefer unique rows until the space is exhausted. Default true. */
  unique?: boolean;
  random?: () => number;
}

export type GenerateCombinationsResult =
  | { ok: true; value: GeneratedCombination[]; uniqueExhausted?: boolean }
  | { ok: false; error: string };

export interface BatchGenerateProgress {
  completed: number;
  total: number;
}

export interface BatchGenerateInput extends GenerateCombinationsInput {
  signal?: AbortSignal;
  chunkSize?: number;
  onProgress?: (progress: BatchGenerateProgress) => void;
}

export type BatchGenerateResult =
  | {
      ok: true;
      value: GeneratedCombination[];
      cancelled: boolean;
      uniqueExhausted: boolean;
    }
  | { ok: false; error: string };

export interface TestDataExportDocument {
  format: 'spinflow.test-data';
  version: 1;
  exportedAt: IsoDateTime;
  dataset: {
    id: TestDatasetId;
    name: string;
    description?: string;
  };
  results: GeneratedCombination[];
}
