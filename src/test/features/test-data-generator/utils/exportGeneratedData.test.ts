import {
  exportGeneratedData,
  slugifyFilename,
  toCsvContents,
  toTestDataExportDocument,
} from '@/features/test-data-generator/utils/exportGeneratedData';
import { downloadFile } from '@/features/test-data-generator/utils/downloadFile';
import type { TestDataset, TestField, TestValue } from '@/features/test-data-generator/types';

vi.mock('@/features/test-data-generator/utils/downloadFile', () => ({
  downloadFile: vi.fn(),
}));

const downloadFileMock = vi.mocked(downloadFile);

function value(name: string): TestValue {
  return {
    id: name.toLowerCase(),
    name,
    weight: 1,
    enabled: true,
    optional: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function field(name: string, values: TestValue[]): TestField {
  return {
    id: name.toLowerCase(),
    name,
    weight: 1,
    enabled: true,
    optional: false,
    values,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const sampleDataset: TestDataset = {
  id: 'ds-1',
  name: 'QA Matrix',
  description: 'Core flows',
  fields: [
    field('Category', [value('Login'), value('Payment')]),
    field('Environment', [value('Staging')]),
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('exportGeneratedData', () => {
  beforeEach(() => {
    downloadFileMock.mockReset();
    downloadFileMock.mockReturnValue(true);
  });

  it('builds an export document and downloads json', () => {
    const results = [{ Category: 'Login', Environment: 'Staging' }];
    const document = toTestDataExportDocument(sampleDataset, results);

    expect(document.format).toBe('spinflow.test-data');
    expect(document.dataset.name).toBe('QA Matrix');
    expect(document.results).toEqual(results);

    expect(exportGeneratedData(sampleDataset, results, 'json')).toEqual({
      ok: true,
      filename: 'qa-matrix-results.json',
    });
    expect(downloadFileMock).toHaveBeenCalledWith(
      'qa-matrix-results.json',
      expect.stringContaining('"Category": "Login"'),
      'application/json',
    );
  });

  it('exports csv with record and combination path columns', () => {
    const results = [{ Category: 'Login', Environment: 'Staging' }];
    const csv = toCsvContents(sampleDataset, results);

    expect(csv).toContain('Record,Combination,Category,Environment');
    expect(csv).toContain('1,Login → Staging,Login,Staging');

    expect(exportGeneratedData(sampleDataset, results, 'csv')).toEqual({
      ok: true,
      filename: 'qa-matrix-results.csv',
    });
    expect(downloadFileMock).toHaveBeenCalledWith(
      'qa-matrix-results.csv',
      expect.stringContaining('Login → Staging'),
      'text/csv;charset=utf-8',
    );
  });

  it('reports download failures', () => {
    downloadFileMock.mockReturnValue(false);
    expect(exportGeneratedData(sampleDataset, [{ Category: 'Login' }], 'json')).toEqual({
      ok: false,
      error: 'download-failed',
    });
  });

  it('slugifies filenames safely', () => {
    expect(slugifyFilename('QA Matrix')).toBe('qa-matrix');
    expect(slugifyFilename('   ')).toBe('test-data');
  });
});
