import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES, withTestDatasetId } from '@/constants/routes';
import {
  TEST_DATA_MESSAGES,
  type TestDataRecordCount,
} from '@/features/test-data-generator/constants';
import type {
  GeneratedCombination,
  TestDatasetId,
  TestFieldId,
  TestValueId,
} from '@/features/test-data-generator/types';
import {
  exportGeneratedData,
  type ExportFormat,
} from '@/features/test-data-generator/utils/exportGeneratedData';
import { generateCombinationsBatch } from '@/features/test-data-generator/utils/generateCombinations';
import type {
  CreateDatasetInput,
  CreateFieldInput,
  CreateValueInput,
} from '@/stores/testDataStore';
import { useTestDataStore } from '@/stores/testDataStore';

export function useTestDataGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('datasetId');

  const datasets = useTestDataStore((state) => state.datasets);
  const createDatasetInStore = useTestDataStore((state) => state.createDataset);
  const deleteDatasetInStore = useTestDataStore((state) => state.deleteDataset);
  const addFieldInStore = useTestDataStore((state) => state.addField);
  const updateFieldInStore = useTestDataStore((state) => state.updateField);
  const deleteFieldInStore = useTestDataStore((state) => state.deleteField);
  const addValueInStore = useTestDataStore((state) => state.addValue);
  const updateValueInStore = useTestDataStore((state) => state.updateValue);
  const deleteValueInStore = useTestDataStore((state) => state.deleteValue);
  const setActiveDataset = useTestDataStore((state) => state.setActiveDataset);

  const dataset = useMemo(
    () => (requestedId ? datasets.find((entry) => entry.id === requestedId) : undefined),
    [datasets, requestedId],
  );

  const needsDatasetChoice = !requestedId && datasets.length > 0;
  const isMissingDataset = Boolean(requestedId && !dataset);

  const [results, setResults] = useState<GeneratedCombination[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [recordCount, setRecordCount] = useState<TestDataRecordCount>(10);
  const [unique, setUnique] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const openCreate = useCallback(() => setCreateOpen(true), []);
  const closeCreate = useCallback(() => setCreateOpen(false), []);
  const clearSuccessMessage = useCallback(() => setSuccessMessage(null), []);

  const selectDataset = useCallback(
    (id: TestDatasetId) => {
      setActiveDataset(id);
      void navigate(withTestDatasetId(ROUTES.testDataGenerator, id));
    },
    [navigate, setActiveDataset],
  );

  const clearDatasetSelection = useCallback(() => {
    abortRef.current?.abort();
    setActiveDataset(null);
    setResults([]);
    setGenerateError(null);
    setInfoMessage(null);
    setProgress(null);
    setGenerating(false);
    void navigate(ROUTES.testDataGenerator);
  }, [navigate, setActiveDataset]);

  const createDataset = useCallback(
    (input: CreateDatasetInput) => {
      const created = createDatasetInStore(input);
      if (!created) {
        return;
      }
      setCreateOpen(false);
      setSuccessMessage(TEST_DATA_MESSAGES.datasetCreated(created.name));
      void navigate(withTestDatasetId(ROUTES.testDataGenerator, created.id));
    },
    [createDatasetInStore, navigate],
  );

  const deleteDataset = useCallback(
    (id: TestDatasetId) => {
      const target = datasets.find((entry) => entry.id === id);
      deleteDatasetInStore(id);
      setResults([]);
      setGenerateError(null);
      setInfoMessage(null);
      if (target) {
        setSuccessMessage(TEST_DATA_MESSAGES.datasetDeleted(target.name));
      }
      void navigate(ROUTES.testDataGenerator);
    },
    [datasets, deleteDatasetInStore, navigate],
  );

  const addField = useCallback(
    (input: CreateFieldInput) => {
      if (!dataset) {
        return;
      }
      const created = addFieldInStore(dataset.id, input);
      if (created) {
        setSuccessMessage(TEST_DATA_MESSAGES.fieldAdded(created.name));
      }
    },
    [addFieldInStore, dataset],
  );

  const toggleFieldEnabled = useCallback(
    (fieldId: TestFieldId) => {
      if (!dataset) {
        return;
      }
      const field = dataset.fields.find((entry) => entry.id === fieldId);
      if (!field) {
        return;
      }
      updateFieldInStore(dataset.id, fieldId, { enabled: !field.enabled });
    },
    [dataset, updateFieldInStore],
  );

  const deleteField = useCallback(
    (fieldId: TestFieldId) => {
      if (!dataset) {
        return;
      }
      deleteFieldInStore(dataset.id, fieldId);
    },
    [dataset, deleteFieldInStore],
  );

  const addValue = useCallback(
    (fieldId: TestFieldId, input: CreateValueInput) => {
      if (!dataset) {
        return;
      }
      const field = dataset.fields.find((entry) => entry.id === fieldId);
      const created = addValueInStore(dataset.id, fieldId, input);
      if (created && field) {
        setSuccessMessage(TEST_DATA_MESSAGES.valueAdded(created.name, field.name));
      }
    },
    [addValueInStore, dataset],
  );

  const toggleValueEnabled = useCallback(
    (fieldId: TestFieldId, valueId: TestValueId) => {
      if (!dataset) {
        return;
      }
      const field = dataset.fields.find((entry) => entry.id === fieldId);
      const value = field?.values.find((entry) => entry.id === valueId);
      if (!value) {
        return;
      }
      updateValueInStore(dataset.id, fieldId, valueId, { enabled: !value.enabled });
    },
    [dataset, updateValueInStore],
  );

  const deleteValue = useCallback(
    (fieldId: TestFieldId, valueId: TestValueId) => {
      if (!dataset) {
        return;
      }
      deleteValueInStore(dataset.id, fieldId, valueId);
    },
    [dataset, deleteValueInStore],
  );

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const generate = useCallback(async () => {
    if (!dataset || generating) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setGenerating(true);
    setGenerateError(null);
    setInfoMessage(null);
    setProgress({ completed: 0, total: recordCount });

    const outcome = await generateCombinationsBatch({
      dataset,
      count: recordCount,
      unique,
      random: Math.random,
      signal: controller.signal,
      onProgress: setProgress,
    });

    if (abortRef.current === controller) {
      abortRef.current = null;
    }

    setGenerating(false);
    setProgress(null);

    if (!outcome.ok) {
      setResults([]);
      setGenerateError(outcome.error);
      return;
    }

    setResults(outcome.value);

    if (outcome.cancelled) {
      setInfoMessage(TEST_DATA_MESSAGES.cancelledPartial(outcome.value.length));
      return;
    }

    if (outcome.uniqueExhausted) {
      setInfoMessage(TEST_DATA_MESSAGES.uniqueExhausted(outcome.value.length, recordCount));
    }
  }, [dataset, generating, recordCount, unique]);

  const exportResults = useCallback(
    (format: ExportFormat) => {
      if (!dataset || results.length === 0) {
        return;
      }
      const outcome = exportGeneratedData(dataset, results, format);
      if (!outcome.ok) {
        setGenerateError(TEST_DATA_MESSAGES.exportFailed);
        return;
      }
      setSuccessMessage(TEST_DATA_MESSAGES.exportSuccess(outcome.filename));
    },
    [dataset, results],
  );

  return {
    datasets,
    dataset,
    needsDatasetChoice,
    isMissingDataset,
    results,
    generateError,
    infoMessage,
    successMessage,
    createOpen,
    recordCount,
    unique,
    generating,
    progress,
    openCreate,
    closeCreate,
    clearSuccessMessage,
    selectDataset,
    clearDatasetSelection,
    createDataset,
    deleteDataset,
    addField,
    toggleFieldEnabled,
    deleteField,
    addValue,
    toggleValueEnabled,
    deleteValue,
    setRecordCount,
    setUnique,
    generate,
    cancelGeneration,
    exportJson: () => exportResults('json'),
    exportCsv: () => exportResults('csv'),
  };
}
