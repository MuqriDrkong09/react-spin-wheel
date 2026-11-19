import { TEST_DATA_EXPORT_FORMAT } from '@/features/test-data-generator/constants';
import type {
  GeneratedCombination,
  TestDataExportDocument,
  TestDataset,
} from '@/features/test-data-generator/types';
import { downloadFile } from '@/features/test-data-generator/utils/downloadFile';
import {
  combinationPathParts,
  hierarchyCsvHeaders,
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

/** Escape a CSV cell per RFC-style rules (quotes, commas, newlines). */
export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/**
 * Flatten hierarchical combination paths into dynamic depth columns.
 * Example (depth 3): Parent,Child,Grandchild / Pizza,Chicken Pepperoni,Large
 */
export function toCsvContents(
  dataset: TestDataset,
  results: readonly GeneratedCombination[],
): string {
  const paths = results.map((row) => combinationPathParts(row, dataset.fields));
  const maxDepth = paths.reduce((max, parts) => Math.max(max, parts.length), 0);
  const headers = hierarchyCsvHeaders(maxDepth);

  if (headers.length === 0) {
    return '\n';
  }

  const headerLine = headers.map(escapeCsvCell).join(',');
  const lines = paths.map((parts) => {
    const cells = headers.map((_, index) => escapeCsvCell(parts[index] ?? ''));
    return cells.join(',');
  });

  return `${[headerLine, ...lines].join('\n')}\n`;
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
