import { TEST_DATA_EXPORT_FORMAT } from '@/features/test-data-generator/constants';
import type {
  GeneratedCombination,
  TestDataExportDocument,
  TestDataset,
} from '@/features/test-data-generator/types';
import { downloadFile } from '@/features/test-data-generator/utils/downloadFile';
import {
  formatCombinationPath,
  orderedFieldNames,
} from '@/features/test-data-generator/utils/formatCombinationPath';
import { nowIso } from '@/utils/id';

export type ExportFormat = 'json' | 'csv';

export function toTestDataExportDocument(
  dataset: TestDataset,
  results: readonly GeneratedCombination[],
): TestDataExportDocument {
  return {
    format: TEST_DATA_EXPORT_FORMAT,
    version: 1,
    exportedAt: nowIso(),
    dataset: {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description,
    },
    results: [...results],
  };
}

export function slugifyFilename(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'test-data';
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function toCsvContents(
  dataset: TestDataset,
  results: readonly GeneratedCombination[],
): string {
  const columns = orderedFieldNames(dataset.fields);
  const header = ['Record', 'Combination', ...columns].map(escapeCsvCell).join(',');
  const lines = results.map((row, index) => {
    const path = formatCombinationPath(row, dataset.fields);
    const cells = [
      String(index + 1),
      path,
      ...columns.map((column) => row[column] ?? ''),
    ].map(escapeCsvCell);
    return cells.join(',');
  });
  return `${[header, ...lines].join('\n')}\n`;
}

export function exportGeneratedData(
  dataset: TestDataset,
  results: readonly GeneratedCombination[],
  format: ExportFormat = 'json',
): { ok: true; filename: string } | { ok: false; error: 'download-failed' } {
  const base = `${slugifyFilename(dataset.name)}-results`;

  if (format === 'csv') {
    const filename = `${base}.csv`;
    const downloaded = downloadFile(filename, toCsvContents(dataset, results), 'text/csv;charset=utf-8');
    if (!downloaded) {
      return { ok: false, error: 'download-failed' };
    }
    return { ok: true, filename };
  }

  const document = toTestDataExportDocument(dataset, results);
  const filename = `${base}.json`;
  const contents = `${JSON.stringify(document, null, 2)}\n`;
  const downloaded = downloadFile(filename, contents, 'application/json');
  if (!downloaded) {
    return { ok: false, error: 'download-failed' };
  }
  return { ok: true, filename };
}
