import {
  exportGeneratedData,
  slugifyFilename,
  toTestDataExportDocument,
} from '@/features/test-data-generator/utils/exportGeneratedData';
import { downloadJsonFile } from '@/features/wheel-export/utils/downloadJsonFile';
import type { TestDataset } from '@/features/test-data-generator/types';

vi.mock('@/features/wheel-export/utils/downloadJsonFile', () => ({
  downloadJsonFile: vi.fn(),
}));

const downloadJsonFileMock = vi.mocked(downloadJsonFile);

const sampleDataset: TestDataset = {
  id: 'ds-1',
  name: 'QA Matrix',
  description: 'Core flows',
  fields: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('exportGeneratedData', () => {
  beforeEach(() => {
    downloadJsonFileMock.mockReset();
    downloadJsonFileMock.mockReturnValue(true);
  });

  it('builds an export document and downloads json', () => {
    const results = [{ Category: 'Login', Environment: 'Staging' }];
    const document = toTestDataExportDocument(sampleDataset, results);

    expect(document.format).toBe('spinflow.test-data');
    expect(document.dataset.name).toBe('QA Matrix');
    expect(document.results).toEqual(results);

    expect(exportGeneratedData(sampleDataset, results)).toEqual({
      ok: true,
      filename: 'qa-matrix-results.json',
    });
    expect(downloadJsonFileMock).toHaveBeenCalledWith(
      'qa-matrix-results.json',
      expect.stringContaining('"Category": "Login"'),
    );
  });

  it('reports download failures', () => {
    downloadJsonFileMock.mockReturnValue(false);
    expect(exportGeneratedData(sampleDataset, [{ Category: 'Login' }])).toEqual({
      ok: false,
      error: 'download-failed',
    });
  });

  it('slugifies filenames safely', () => {
    expect(slugifyFilename('QA Matrix')).toBe('qa-matrix');
    expect(slugifyFilename('   ')).toBe('test-data');
  });
});
