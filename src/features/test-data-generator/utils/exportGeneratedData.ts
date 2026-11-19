import { TEST_DATA_EXPORT_FORMAT } from '@/features/test-data-generator/constants';
import type {
  GeneratedCombination,
  TestDataExportDocument,
  TestDataset,
} from '@/features/test-data-generator/types';
import { downloadJsonFile } from '@/features/wheel-export/utils/downloadJsonFile';
import { nowIso } from '@/utils/id';

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

export function exportGeneratedData(
  dataset: TestDataset,
  results: readonly GeneratedCombination[],
): { ok: true; filename: string } | { ok: false; error: 'download-failed' } {
  const document = toTestDataExportDocument(dataset, results);
  const filename = `${slugifyFilename(dataset.name)}-results.json`;
  const contents = `${JSON.stringify(document, null, 2)}\n`;
  const downloaded = downloadJsonFile(filename, contents);
  if (!downloaded) {
    return { ok: false, error: 'download-failed' };
  }
  return { ok: true, filename };
}
