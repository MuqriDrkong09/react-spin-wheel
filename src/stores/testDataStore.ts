import { create } from 'zustand';

import { TEST_DATA_LIMITS } from '@/features/test-data-generator/constants';
import type {
  TestDataset,
  TestDatasetId,
  TestField,
  TestFieldId,
  TestValue,
  TestValueId,
} from '@/features/test-data-generator/types';
import { createId, nowIso } from '@/utils/id';

export interface CreateDatasetInput {
  name: string;
  description?: string;
}

export interface CreateFieldInput {
  name: string;
  weight?: number;
  optional?: boolean;
  enabled?: boolean;
}

export interface CreateValueInput {
  name: string;
  weight?: number;
  optional?: boolean;
  enabled?: boolean;
}

interface TestDataStore {
  datasets: TestDataset[];
  activeDatasetId: TestDatasetId | null;
  createDataset: (input: CreateDatasetInput) => TestDataset | undefined;
  updateDataset: (id: TestDatasetId, patch: Partial<Pick<TestDataset, 'name' | 'description'>>) => void;
  deleteDataset: (id: TestDatasetId) => void;
  setActiveDataset: (id: TestDatasetId | null) => void;
  addField: (datasetId: TestDatasetId, input: CreateFieldInput) => TestField | undefined;
  updateField: (
    datasetId: TestDatasetId,
    fieldId: TestFieldId,
    patch: Partial<Pick<TestField, 'name' | 'weight' | 'optional' | 'enabled'>>,
  ) => void;
  deleteField: (datasetId: TestDatasetId, fieldId: TestFieldId) => void;
  addValue: (
    datasetId: TestDatasetId,
    fieldId: TestFieldId,
    input: CreateValueInput,
  ) => TestValue | undefined;
  updateValue: (
    datasetId: TestDatasetId,
    fieldId: TestFieldId,
    valueId: TestValueId,
    patch: Partial<Pick<TestValue, 'name' | 'weight' | 'optional' | 'enabled'>>,
  ) => void;
  deleteValue: (datasetId: TestDatasetId, fieldId: TestFieldId, valueId: TestValueId) => void;
}

function mapDataset(
  datasets: TestDataset[],
  datasetId: TestDatasetId,
  updater: (dataset: TestDataset) => TestDataset,
): TestDataset[] {
  return datasets.map((dataset) => (dataset.id === datasetId ? updater(dataset) : dataset));
}

export const useTestDataStore = create<TestDataStore>((set, get) => ({
  datasets: [],
  activeDatasetId: null,

  createDataset: (input) => {
    const name = input.name.trim();
    if (!name || get().datasets.length >= TEST_DATA_LIMITS.maxDatasets) {
      return undefined;
    }

    const stamp = nowIso();
    const dataset: TestDataset = {
      id: createId(),
      name,
      description: input.description?.trim() || undefined,
      fields: [],
      createdAt: stamp,
      updatedAt: stamp,
    };

    set((state) => ({
      datasets: [dataset, ...state.datasets],
      activeDatasetId: dataset.id,
    }));
    return dataset;
  },

  updateDataset: (id, patch) => {
    set((state) => ({
      datasets: mapDataset(state.datasets, id, (dataset) => ({
        ...dataset,
        name: patch.name?.trim() || dataset.name,
        description:
          patch.description === undefined
            ? dataset.description
            : patch.description.trim() || undefined,
        updatedAt: nowIso(),
      })),
    }));
  },

  deleteDataset: (id) => {
    set((state) => {
      const datasets = state.datasets.filter((dataset) => dataset.id !== id);
      return {
        datasets,
        activeDatasetId: state.activeDatasetId === id ? null : state.activeDatasetId,
      };
    });
  },

  setActiveDataset: (id) => {
    if (id !== null && !get().datasets.some((dataset) => dataset.id === id)) {
      return;
    }
    set({ activeDatasetId: id });
  },

  addField: (datasetId, input) => {
    const name = input.name.trim();
    if (!name) {
      return undefined;
    }

    let created: TestField | undefined;
    set((state) => ({
      datasets: mapDataset(state.datasets, datasetId, (dataset) => {
        if (dataset.fields.length >= TEST_DATA_LIMITS.maxFields) {
          return dataset;
        }
        const stamp = nowIso();
        created = {
          id: createId(),
          name,
          weight: input.weight ?? 1,
          enabled: input.enabled ?? true,
          optional: input.optional ?? false,
          values: [],
          createdAt: stamp,
          updatedAt: stamp,
        };
        return {
          ...dataset,
          fields: [...dataset.fields, created],
          updatedAt: stamp,
        };
      }),
    }));
    return created;
  },

  updateField: (datasetId, fieldId, patch) => {
    set((state) => ({
      datasets: mapDataset(state.datasets, datasetId, (dataset) => ({
        ...dataset,
        fields: dataset.fields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                ...patch,
                name: patch.name?.trim() || field.name,
                updatedAt: nowIso(),
              }
            : field,
        ),
        updatedAt: nowIso(),
      })),
    }));
  },

  deleteField: (datasetId, fieldId) => {
    set((state) => ({
      datasets: mapDataset(state.datasets, datasetId, (dataset) => ({
        ...dataset,
        fields: dataset.fields.filter((field) => field.id !== fieldId),
        updatedAt: nowIso(),
      })),
    }));
  },

  addValue: (datasetId, fieldId, input) => {
    const name = input.name.trim();
    if (!name) {
      return undefined;
    }

    let created: TestValue | undefined;
    set((state) => ({
      datasets: mapDataset(state.datasets, datasetId, (dataset) => ({
        ...dataset,
        fields: dataset.fields.map((field) => {
          if (field.id !== fieldId || field.values.length >= TEST_DATA_LIMITS.maxValuesPerField) {
            return field;
          }
          const stamp = nowIso();
          created = {
            id: createId(),
            name,
            weight: input.weight ?? 1,
            enabled: input.enabled ?? true,
            optional: input.optional ?? false,
            createdAt: stamp,
            updatedAt: stamp,
          };
          return {
            ...field,
            values: [...field.values, created],
            updatedAt: stamp,
          };
        }),
        updatedAt: nowIso(),
      })),
    }));
    return created;
  },

  updateValue: (datasetId, fieldId, valueId, patch) => {
    set((state) => ({
      datasets: mapDataset(state.datasets, datasetId, (dataset) => ({
        ...dataset,
        fields: dataset.fields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                values: field.values.map((value) =>
                  value.id === valueId
                    ? {
                        ...value,
                        ...patch,
                        name: patch.name?.trim() || value.name,
                        updatedAt: nowIso(),
                      }
                    : value,
                ),
                updatedAt: nowIso(),
              }
            : field,
        ),
        updatedAt: nowIso(),
      })),
    }));
  },

  deleteValue: (datasetId, fieldId, valueId) => {
    set((state) => ({
      datasets: mapDataset(state.datasets, datasetId, (dataset) => ({
        ...dataset,
        fields: dataset.fields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                values: field.values.filter((value) => value.id !== valueId),
                updatedAt: nowIso(),
              }
            : field,
        ),
        updatedAt: nowIso(),
      })),
    }));
  },
}));

export function resetTestDataStore(): void {
  useTestDataStore.setState({ datasets: [], activeDatasetId: null });
}
