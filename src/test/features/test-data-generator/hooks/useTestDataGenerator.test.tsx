import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { ROUTES, withTestDatasetId } from '@/constants/routes';
import { TEST_DATA_LIMITS, TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import { useTestDataGenerator } from '@/features/test-data-generator/hooks/useTestDataGenerator';
import { downloadFile } from '@/features/test-data-generator/utils/downloadFile';
import * as generateCombinations from '@/features/test-data-generator/utils/generateCombinations';
import { resetTestDataStore, useTestDataStore } from '@/stores/testDataStore';

vi.mock('@/features/test-data-generator/utils/downloadFile', () => ({
  downloadFile: vi.fn(),
}));

const downloadFileMock = vi.mocked(downloadFile);

function wrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };
}

function useHookWithLocation() {
  const editor = useTestDataGenerator();
  const location = useLocation();

  return {
    ...editor,
    href: `${location.pathname}${location.search}`,
  };
}

function renderGenerator(initialEntry = ROUTES.testDataGenerator) {
  return renderHook(() => useHookWithLocation(), {
    wrapper: wrapper(initialEntry),
  });
}

function seedDataset(name = 'QA Matrix', description?: string) {
  return useTestDataStore.getState().createDataset({ name, description })!;
}

function seedEditableDataset() {
  const dataset = seedDataset('Editable');
  const category = useTestDataStore.getState().addField(dataset.id, { name: 'Category' })!;
  useTestDataStore.getState().addValue(dataset.id, category.id, { name: 'Login' });
  useTestDataStore.getState().addValue(dataset.id, category.id, { name: 'Payment' });
  return { dataset, categoryId: category.id };
}

describe('useTestDataGenerator', () => {
  beforeEach(() => {
    resetTestDataStore();
    downloadFileMock.mockReset();
    downloadFileMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts empty with create dialog closed and default generate options', () => {
    const { result } = renderGenerator();

    expect(result.current.datasets).toEqual([]);
    expect(result.current.dataset).toBeUndefined();
    expect(result.current.needsDatasetChoice).toBe(false);
    expect(result.current.isMissingDataset).toBe(false);
    expect(result.current.createOpen).toBe(false);
    expect(result.current.recordCount).toBe(10);
    expect(result.current.unique).toBe(true);
    expect(result.current.results).toEqual([]);
    expect(result.current.generateError).toBeNull();
    expect(result.current.infoMessage).toBeNull();
    expect(result.current.successMessage).toBeNull();
    expect(result.current.generating).toBe(false);
    expect(result.current.progress).toBeNull();
  });

  it('flags dataset choice when datasets exist without a selected id', () => {
    seedDataset('Alpha');
    seedDataset('Beta');

    const { result } = renderGenerator();

    expect(result.current.needsDatasetChoice).toBe(true);
    expect(result.current.isMissingDataset).toBe(false);
    expect(result.current.dataset).toBeUndefined();
    expect(result.current.datasets).toHaveLength(2);
  });

  it('flags a missing dataset for unknown dataset ids', () => {
    seedDataset('Alive');

    const { result } = renderGenerator(`${ROUTES.testDataGenerator}?datasetId=missing`);

    expect(result.current.isMissingDataset).toBe(true);
    expect(result.current.needsDatasetChoice).toBe(false);
    expect(result.current.dataset).toBeUndefined();
  });

  it('opens and closes the create dialog', () => {
    const { result } = renderGenerator();

    act(() => {
      result.current.openCreate();
    });
    expect(result.current.createOpen).toBe(true);

    act(() => {
      result.current.closeCreate();
    });
    expect(result.current.createOpen).toBe(false);
  });

  it('creates a dataset, closes the dialog, navigates, and sets success', () => {
    const { result } = renderGenerator();

    act(() => {
      result.current.openCreate();
      result.current.createDataset({ name: 'QA Matrix', description: 'Auth' });
    });

    const created = useTestDataStore.getState().datasets[0];
    expect(created?.name).toBe('QA Matrix');
    expect(created?.description).toBe('Auth');
    expect(result.current.createOpen).toBe(false);
    expect(result.current.successMessage).toBe(TEST_DATA_MESSAGES.datasetCreated('QA Matrix'));
    expect(result.current.href).toBe(withTestDatasetId(ROUTES.testDataGenerator, created!.id));
  });

  it('ignores create when the store rejects the dataset', () => {
    for (let index = 0; index < TEST_DATA_LIMITS.maxDatasets; index += 1) {
      seedDataset(`Dataset ${index}`);
    }

    const { result } = renderGenerator();
    const beforeCount = useTestDataStore.getState().datasets.length;

    act(() => {
      result.current.openCreate();
      result.current.createDataset({ name: 'Overflow' });
    });

    expect(useTestDataStore.getState().datasets).toHaveLength(beforeCount);
    expect(result.current.createOpen).toBe(true);
    expect(result.current.successMessage).toBeNull();
    expect(result.current.href).toBe(ROUTES.testDataGenerator);
  });

  it('selects a dataset and clears the selection', () => {
    const dataset = seedDataset('Alpha');
    const { result } = renderGenerator();

    act(() => {
      result.current.selectDataset(dataset.id);
    });

    expect(useTestDataStore.getState().activeDatasetId).toBe(dataset.id);
    expect(result.current.href).toBe(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.clearDatasetSelection();
    });

    expect(useTestDataStore.getState().activeDatasetId).toBeNull();
    expect(result.current.results).toEqual([]);
    expect(result.current.generateError).toBeNull();
    expect(result.current.infoMessage).toBeNull();
    expect(result.current.progress).toBeNull();
    expect(result.current.generating).toBe(false);
    expect(result.current.href).toBe(ROUTES.testDataGenerator);
  });

  it('deletes a dataset, clears generation state, and navigates home', async () => {
    const { dataset } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.setRecordCount(1);
    });
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.results.length).toBeGreaterThan(0);

    act(() => {
      result.current.deleteDataset(dataset.id);
    });

    expect(useTestDataStore.getState().datasets).toEqual([]);
    expect(result.current.results).toEqual([]);
    expect(result.current.generateError).toBeNull();
    expect(result.current.infoMessage).toBeNull();
    expect(result.current.successMessage).toBe(TEST_DATA_MESSAGES.datasetDeleted('Editable'));
    expect(result.current.href).toBe(ROUTES.testDataGenerator);
  });

  it('adds, toggles, and deletes fields and values on the active dataset', () => {
    const { dataset, categoryId } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.addField({ name: 'Environment', optional: true });
    });
    expect(result.current.successMessage).toBe(TEST_DATA_MESSAGES.fieldAdded('Environment'));
    expect(result.current.dataset?.fields.map((field) => field.name)).toEqual([
      'Category',
      'Environment',
    ]);

    const environmentId = result.current.dataset!.fields[1]!.id;

    act(() => {
      result.current.addValue(environmentId, { name: 'Staging' });
    });
    expect(result.current.successMessage).toBe(
      TEST_DATA_MESSAGES.valueAdded('Staging', 'Environment'),
    );

    act(() => {
      result.current.toggleFieldEnabled(environmentId);
      result.current.toggleValueEnabled(categoryId, result.current.dataset!.fields[0]!.values[0]!.id);
    });

    const category = useTestDataStore.getState().datasets[0]?.fields.find((field) => field.id === categoryId);
    const environment = useTestDataStore
      .getState()
      .datasets[0]?.fields.find((field) => field.id === environmentId);
    expect(environment?.enabled).toBe(false);
    expect(category?.values[0]?.enabled).toBe(false);

    act(() => {
      result.current.deleteValue(categoryId, category!.values[0]!.id);
      result.current.deleteField(environmentId);
    });

    expect(
      useTestDataStore.getState().datasets[0]?.fields.map((field) => field.name),
    ).toEqual(['Category']);
    expect(useTestDataStore.getState().datasets[0]?.fields[0]?.values.map((value) => value.name)).toEqual([
      'Payment',
    ]);
  });

  it('no-ops structure mutations when no dataset is selected', () => {
    const { result } = renderGenerator();

    act(() => {
      result.current.addField({ name: 'Category' });
      result.current.toggleFieldEnabled('missing');
      result.current.deleteField('missing');
      result.current.addValue('missing', { name: 'Login' });
      result.current.toggleValueEnabled('missing', 'missing');
      result.current.deleteValue('missing', 'missing');
      result.current.exportJson();
      result.current.exportCsv();
    });

    expect(useTestDataStore.getState().datasets).toEqual([]);
    expect(result.current.successMessage).toBeNull();
    expect(result.current.generateError).toBeNull();
  });

  it('updates record count and unique flags', () => {
    const { result } = renderGenerator();

    act(() => {
      result.current.setRecordCount(50);
      result.current.setUnique(false);
    });

    expect(result.current.recordCount).toBe(50);
    expect(result.current.unique).toBe(false);
  });

  it('generates combinations and clears success messages', async () => {
    const { dataset } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.setRecordCount(1);
    });

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.generating).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.generateError).toBeNull();
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]).toEqual(
      expect.objectContaining({
        Category: expect.stringMatching(/Login|Payment/),
      }),
    );

    act(() => {
      result.current.clearSuccessMessage();
    });
    expect(result.current.successMessage).toBeNull();
  });

  it('surfaces generate validation errors and clears prior results', async () => {
    const dataset = seedDataset('Broken');
    useTestDataStore.getState().addField(dataset.id, { name: 'Category' });
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.setRecordCount(1);
    });
    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.generateError).toBe(TEST_DATA_MESSAGES.noEnabledFields);
  });

  it('reports unique exhaustion when fewer unique rows exist than requested', async () => {
    const { dataset } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.setRecordCount(10);
      result.current.setUnique(true);
    });

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.results).toHaveLength(2);
    expect(result.current.infoMessage).toBe(TEST_DATA_MESSAGES.uniqueExhausted(2, 10));
  });

  it('cancels an in-flight generation and keeps partial results', async () => {
    const dataset = seedDataset('Wide');
    const category = useTestDataStore.getState().addField(dataset.id, { name: 'Category' })!;
    const product = useTestDataStore.getState().addField(dataset.id, { name: 'Product' })!;
    for (const name of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      useTestDataStore.getState().addValue(dataset.id, category.id, { name });
      useTestDataStore.getState().addValue(dataset.id, product.id, { name: `P-${name}` });
    }

    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.setRecordCount(1000);
      result.current.setUnique(false);
    });

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.generating).toBe(true);
      expect(result.current.progress).not.toBeNull();
    });

    act(() => {
      result.current.cancelGeneration();
    });

    await act(async () => {
      await pending;
    });

    expect(result.current.generating).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.infoMessage).toMatch(/Generation cancelled after/);
    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.results.length).toBeLessThan(1000);
  }, 30_000);

  it('exports json and csv after generation', async () => {
    const { dataset } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.setRecordCount(1);
    });
    await act(async () => {
      await result.current.generate();
    });

    act(() => {
      result.current.exportJson();
    });
    expect(downloadFileMock).toHaveBeenCalledWith(
      'editable-results.json',
      expect.stringContaining('"format": "spinflow.test-data"'),
      'application/json',
    );
    expect(result.current.successMessage).toBe(
      TEST_DATA_MESSAGES.exportSuccess('editable-results.json'),
    );

    act(() => {
      result.current.exportCsv();
    });
    expect(downloadFileMock).toHaveBeenCalledWith(
      'editable-results.csv',
      expect.stringMatching(/^Parent\n(?:Login|Payment)\n$/),
      'text/csv;charset=utf-8',
    );
    expect(result.current.successMessage).toBe(
      TEST_DATA_MESSAGES.exportSuccess('editable-results.csv'),
    );
  });

  it('reports export failures without clearing generated results', async () => {
    const { dataset } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.setRecordCount(1);
    });
    await act(async () => {
      await result.current.generate();
    });
    const generated = result.current.results;

    downloadFileMock.mockReturnValue(false);
    act(() => {
      result.current.exportCsv();
    });

    expect(result.current.generateError).toBe(TEST_DATA_MESSAGES.exportFailed);
    expect(result.current.results).toEqual(generated);
  });

  it('aborts in-flight generation on unmount', async () => {
    const dataset = seedDataset('Unmount');
    const category = useTestDataStore.getState().addField(dataset.id, { name: 'Category' })!;
    useTestDataStore.getState().addValue(dataset.id, category.id, { name: 'Login' });
    useTestDataStore.getState().addValue(dataset.id, category.id, { name: 'Payment' });

    const { result, unmount } = renderGenerator(
      withTestDatasetId(ROUTES.testDataGenerator, dataset.id),
    );

    act(() => {
      result.current.setRecordCount(1000);
      result.current.setUnique(false);
    });

    act(() => {
      void result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.generating).toBe(true);
    });

    unmount();
  }, 30_000);

  it('ignores generate when no dataset is selected', async () => {
    const batchSpy = vi.spyOn(generateCombinations, 'generateCombinationsBatch');
    const { result } = renderGenerator();

    await act(async () => {
      await result.current.generate();
    });

    expect(batchSpy).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
    expect(result.current.generating).toBe(false);
  });

  it('ignores a second generate call while generation is already running', async () => {
    const { dataset } = seedEditableDataset();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const batchSpy = vi
      .spyOn(generateCombinations, 'generateCombinationsBatch')
      .mockImplementation(async (input) => {
        input.onProgress?.({ completed: 0, total: input.count });
        await gate;
        return {
          ok: true,
          value: [{ Category: 'Login' }],
          cancelled: false,
          uniqueExhausted: false,
        };
      });

    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    let first!: Promise<void>;
    act(() => {
      first = result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.generating).toBe(true);
    });

    await act(async () => {
      await result.current.generate();
    });
    expect(batchSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      release();
      await first;
    });

    expect(result.current.generating).toBe(false);
    expect(result.current.results).toEqual([{ Category: 'Login' }]);
  });

  it('no-ops field and value toggles for unknown ids on the active dataset', () => {
    const { dataset, categoryId } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));
    const before = structuredClone(useTestDataStore.getState().datasets);

    act(() => {
      result.current.toggleFieldEnabled('missing-field');
      result.current.toggleValueEnabled(categoryId, 'missing-value');
      result.current.toggleValueEnabled('missing-field', 'missing-value');
    });

    expect(useTestDataStore.getState().datasets).toEqual(before);
  });

  it('clears a prior generate error on the next successful run', async () => {
    const dataset = seedDataset('Recover');
    const category = useTestDataStore.getState().addField(dataset.id, { name: 'Category' })!;
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.setRecordCount(1);
    });
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.generateError).toBe(TEST_DATA_MESSAGES.noEnabledFields);

    act(() => {
      useTestDataStore.getState().addValue(dataset.id, category.id, { name: 'Login' });
    });

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.generateError).toBeNull();
    expect(result.current.results).toEqual([{ Category: 'Login' }]);
  });

  it('reports json export failures', async () => {
    const { dataset } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.setRecordCount(1);
    });
    await act(async () => {
      await result.current.generate();
    });

    downloadFileMock.mockReturnValue(false);
    act(() => {
      result.current.exportJson();
    });

    expect(result.current.generateError).toBe(TEST_DATA_MESSAGES.exportFailed);
    expect(result.current.successMessage).toBeNull();
  });

  it('clears success messages after a successful mutation', () => {
    const { dataset } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.addField({ name: 'Environment' });
    });
    expect(result.current.successMessage).toBe(TEST_DATA_MESSAGES.fieldAdded('Environment'));

    act(() => {
      result.current.clearSuccessMessage();
    });
    expect(result.current.successMessage).toBeNull();
  });

  it('deletes an unknown dataset id without a success toast', () => {
    seedDataset('Keep');
    const { result } = renderGenerator();

    act(() => {
      result.current.deleteDataset('missing-dataset');
    });

    expect(useTestDataStore.getState().datasets).toHaveLength(1);
    expect(result.current.successMessage).toBeNull();
    expect(result.current.href).toBe(ROUTES.testDataGenerator);
  });

  it('aborts generation when clearing the dataset selection mid-run', async () => {
    const { dataset } = seedEditableDataset();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    vi.spyOn(generateCombinations, 'generateCombinationsBatch').mockImplementation(async (input) => {
      input.onProgress?.({ completed: 0, total: input.count });
      await gate;
      if (input.signal?.aborted) {
        return { ok: true, value: [], cancelled: true, uniqueExhausted: false };
      }
      return {
        ok: true,
        value: [{ Category: 'Login' }],
        cancelled: false,
        uniqueExhausted: false,
      };
    });

    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.generating).toBe(true);
    });

    act(() => {
      result.current.clearDatasetSelection();
    });

    expect(result.current.generating).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.results).toEqual([]);
    expect(result.current.href).toBe(ROUTES.testDataGenerator);

    await act(async () => {
      release();
      await pending;
    });
  });

  it('does not set success when addField or addValue is rejected by the store', () => {
    const { dataset, categoryId } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    for (let index = 0; index < TEST_DATA_LIMITS.maxFields; index += 1) {
      useTestDataStore.getState().addField(dataset.id, { name: `Field ${index}` });
    }

    act(() => {
      result.current.addField({ name: 'Overflow Field' });
    });
    expect(result.current.successMessage).toBeNull();
    expect(
      useTestDataStore.getState().datasets[0]?.fields.some((entry) => entry.name === 'Overflow Field'),
    ).toBe(false);

    const field = useTestDataStore.getState().datasets[0]?.fields.find((entry) => entry.id === categoryId)!;
    for (let index = field.values.length; index < TEST_DATA_LIMITS.maxValuesPerField; index += 1) {
      useTestDataStore.getState().addValue(dataset.id, categoryId, { name: `Value ${index}` });
    }

    act(() => {
      result.current.addValue(categoryId, { name: 'Overflow Value' });
    });
    expect(result.current.successMessage).toBeNull();
    expect(
      useTestDataStore
        .getState()
        .datasets[0]?.fields.find((entry) => entry.id === categoryId)
        ?.values.some((entry) => entry.name === 'Overflow Value'),
    ).toBe(false);

    act(() => {
      result.current.addValue('missing-field', { name: 'Orphan' });
    });
    expect(result.current.successMessage).toBeNull();
  });

  it('allows cancelGeneration when nothing is running', () => {
    const { result } = renderGenerator();

    act(() => {
      result.current.cancelGeneration();
    });

    expect(result.current.generating).toBe(false);
    expect(result.current.progress).toBeNull();
  });

  it('clears generate error and info when changing dataset selection', async () => {
    const { dataset } = seedEditableDataset();
    const other = seedDataset('Other');
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.setRecordCount(10);
      result.current.setUnique(true);
    });
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.infoMessage).toBe(TEST_DATA_MESSAGES.uniqueExhausted(2, 10));

    act(() => {
      result.current.clearDatasetSelection();
    });
    expect(result.current.infoMessage).toBeNull();
    expect(result.current.generateError).toBeNull();
    expect(result.current.results).toEqual([]);

    act(() => {
      result.current.selectDataset(other.id);
    });
    expect(result.current.href).toBe(withTestDatasetId(ROUTES.testDataGenerator, other.id));
  });

  it('loads the active dataset from the URL after create', () => {
    const { result } = renderGenerator();

    act(() => {
      result.current.createDataset({ name: 'From Hook' });
    });

    const created = useTestDataStore.getState().datasets[0]!;
    expect(result.current.href).toBe(withTestDatasetId(ROUTES.testDataGenerator, created.id));
    expect(result.current.dataset?.id).toBe(created.id);
    expect(result.current.needsDatasetChoice).toBe(false);
    expect(result.current.isMissingDataset).toBe(false);
  });

  it('exports nothing when results are empty even with an active dataset', () => {
    const { dataset } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.exportJson();
      result.current.exportCsv();
    });

    expect(downloadFileMock).not.toHaveBeenCalled();
    expect(result.current.successMessage).toBeNull();
    expect(result.current.generateError).toBeNull();
  });

  it('re-toggles a disabled field back on', () => {
    const { dataset, categoryId } = seedEditableDataset();
    const { result } = renderGenerator(withTestDatasetId(ROUTES.testDataGenerator, dataset.id));

    act(() => {
      result.current.toggleFieldEnabled(categoryId);
    });
    expect(
      useTestDataStore.getState().datasets[0]?.fields.find((entry) => entry.id === categoryId)?.enabled,
    ).toBe(false);

    act(() => {
      result.current.toggleFieldEnabled(categoryId);
    });
    expect(
      useTestDataStore.getState().datasets[0]?.fields.find((entry) => entry.id === categoryId)?.enabled,
    ).toBe(true);
  });
});
