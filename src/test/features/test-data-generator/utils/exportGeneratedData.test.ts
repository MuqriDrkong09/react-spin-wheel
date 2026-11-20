import {
  escapeCsvCell,
  exportGeneratedData,
  slugifyFilename,
  toCsvContents,
  toTestDataExportDocument,
} from '@/features/test-data-generator/utils/exportGeneratedData';
import { downloadFile } from '@/features/test-data-generator/utils/downloadFile';
import { hierarchyCsvHeaders } from '@/features/test-data-generator/utils/formatCombinationPath';
import type { TestDataset, TestField, TestValue } from '@/features/test-data-generator/types';

vi.mock('@/features/test-data-generator/utils/downloadFile', () => ({
  downloadFile: vi.fn(),
}));

const downloadFileMock = vi.mocked(downloadFile);

function value(name: string): TestValue {
  return {
    id: name.toLowerCase().replaceAll(' ', '-'),
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
    id: name.toLowerCase().replaceAll(' ', '-'),
    name,
    weight: 1,
    enabled: true,
    optional: false,
    values,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const foodDataset: TestDataset = {
  id: 'ds-food',
  name: 'Food Tree',
  fields: [
    field('Category', [value('Pizza'), value('Burger')]),
    field('Item', [value('Chicken Pepperoni'), value('Beef Pepperoni'), value('Chicken Burger')]),
    field('Size', [value('Large'), value('Medium')]),
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

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

describe('hierarchyCsvHeaders', () => {
  it('uses Parent/Child/Grandchild for shallow depths', () => {
    expect(hierarchyCsvHeaders(0)).toEqual([]);
    expect(hierarchyCsvHeaders(1)).toEqual(['Parent']);
    expect(hierarchyCsvHeaders(2)).toEqual(['Parent', 'Child']);
    expect(hierarchyCsvHeaders(3)).toEqual(['Parent', 'Child', 'Grandchild']);
  });

  it('uses Level N headers when depth exceeds three', () => {
    expect(hierarchyCsvHeaders(4)).toEqual(['Level 1', 'Level 2', 'Level 3', 'Level 4']);
    expect(hierarchyCsvHeaders(5)).toEqual([
      'Level 1',
      'Level 2',
      'Level 3',
      'Level 4',
      'Level 5',
    ]);
  });
});

describe('escapeCsvCell', () => {
  it('escapes commas, quotes, and line breaks', () => {
    expect(escapeCsvCell('plain')).toBe('plain');
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('line\nbreak')).toBe('"line\nbreak"');
    expect(escapeCsvCell('line\rbreak')).toBe('"line\rbreak"');
  });
});

describe('slugifyFilename', () => {
  it('normalizes names and falls back for empty slugs', () => {
    expect(slugifyFilename('QA Matrix')).toBe('qa-matrix');
    expect(slugifyFilename('  Food / Menu!!  ')).toBe('food-menu');
    expect(slugifyFilename('---Hello---')).toBe('hello');
    expect(slugifyFilename('   ')).toBe('test-data');
    expect(slugifyFilename('@@@')).toBe('test-data');
  });
});

describe('toTestDataExportDocument', () => {
  it('copies dataset metadata and results into a versioned document', () => {
    const results = [{ Category: 'Login', Environment: 'Staging' }];
    const document = toTestDataExportDocument(sampleDataset, results);

    expect(document.format).toBe('spinflow.test-data');
    expect(document.version).toBe(1);
    expect(document.exportedAt).toEqual(expect.any(String));
    expect(document.dataset).toEqual({
      id: 'ds-1',
      name: 'QA Matrix',
      description: 'Core flows',
    });
    expect(document.results).toEqual(results);
    expect(document.results).not.toBe(results);
  });
});

describe('toCsvContents', () => {
  it('returns a lone newline when there are no path parts', () => {
    expect(toCsvContents(sampleDataset, [])).toBe('\n');
  });

  it('flattens hierarchical paths into Parent/Child/Grandchild columns', () => {
    const results = [
      { Category: 'Pizza', Item: 'Chicken Pepperoni', Size: 'Large' },
      { Category: 'Pizza', Item: 'Beef Pepperoni', Size: 'Medium' },
      { Category: 'Burger', Item: 'Chicken Burger', Size: 'Large' },
    ];
    const csv = toCsvContents(foodDataset, results);

    expect(csv).toBe(
      [
        'Parent,Child,Grandchild',
        'Pizza,Chicken Pepperoni,Large',
        'Pizza,Beef Pepperoni,Medium',
        'Burger,Chicken Burger,Large',
        '',
      ].join('\n'),
    );
  });

  it('uses Parent only for single-level paths', () => {
    const dataset: TestDataset = {
      ...sampleDataset,
      fields: [field('Category', [value('Login'), value('Payment')])],
    };

    expect(toCsvContents(dataset, [{ Category: 'Login' }, { Category: 'Payment' }])).toBe(
      'Parent\nLogin\nPayment\n',
    );
  });

  it('skips disabled fields and pads shorter optional paths', () => {
    const dataset: TestDataset = {
      ...sampleDataset,
      fields: [
        field('Category', [value('Login')]),
        { ...field('Notes', [value('Legacy')]), enabled: false },
        { ...field('Environment', [value('Staging')]), optional: true },
      ],
    };
    const csv = toCsvContents(dataset, [
      { Category: 'Login', Environment: 'Staging' },
      { Category: 'Login' },
    ]);

    expect(csv).toBe('Parent,Child\nLogin,Staging\nLogin,\n');
    expect(csv).not.toContain('Legacy');
  });

  it('pads shorter paths and uses Level N headers for deep hierarchies', () => {
    const deepDataset: TestDataset = {
      ...foodDataset,
      id: 'ds-deep',
      fields: [
        field('L1', [value('A')]),
        field('L2', [value('B')]),
        field('L3', [value('C')]),
        field('L4', [value('D')]),
      ],
    };
    const results = [
      { L1: 'A', L2: 'B', L3: 'C', L4: 'D' },
      { L1: 'A', L2: 'B' },
    ];
    const csv = toCsvContents(deepDataset, results);

    expect(csv).toBe('Level 1,Level 2,Level 3,Level 4\nA,B,C,D\nA,B,,\n');
  });

  it('escapes special characters inside flattened csv cells', () => {
    const dataset: TestDataset = {
      ...sampleDataset,
      fields: [field('Category', [value('Login, "secure"')])],
    };
    const csv = toCsvContents(dataset, [{ Category: 'Login, "secure"' }]);
    expect(csv).toBe('Parent\n"Login, ""secure"""\n');
  });
});

describe('exportGeneratedData', () => {
  beforeEach(() => {
    downloadFileMock.mockReset();
    downloadFileMock.mockReturnValue(true);
  });

  it('builds an export document and downloads json by default', () => {
    const results = [{ Category: 'Login', Environment: 'Staging' }];

    expect(exportGeneratedData(sampleDataset, results)).toEqual({
      ok: true,
      filename: 'qa-matrix-results.json',
    });
    expect(downloadFileMock).toHaveBeenCalledWith(
      'qa-matrix-results.json',
      expect.stringContaining('"format": "spinflow.test-data"'),
      'application/json',
    );
    expect(downloadFileMock).toHaveBeenCalledWith(
      'qa-matrix-results.json',
      expect.stringContaining('"Category": "Login"'),
      'application/json',
    );
  });

  it('downloads flattened csv', () => {
    const results = [{ Category: 'Login', Environment: 'Staging' }];
    expect(exportGeneratedData(sampleDataset, results, 'csv')).toEqual({
      ok: true,
      filename: 'qa-matrix-results.csv',
    });
    expect(downloadFileMock).toHaveBeenCalledWith(
      'qa-matrix-results.csv',
      'Parent,Child\nLogin,Staging\n',
      'text/csv;charset=utf-8',
    );
  });

  it('reports json download failures', () => {
    downloadFileMock.mockReturnValue(false);
    expect(exportGeneratedData(sampleDataset, [{ Category: 'Login' }], 'json')).toEqual({
      ok: false,
      error: 'download-failed',
    });
  });

  it('reports csv download failures', () => {
    downloadFileMock.mockReturnValue(false);
    expect(exportGeneratedData(sampleDataset, [{ Category: 'Login' }], 'csv')).toEqual({
      ok: false,
      error: 'download-failed',
    });
  });

  it('slugifies awkward dataset names in download filenames', () => {
    const dataset: TestDataset = {
      ...sampleDataset,
      name: '  Food / Menu!!  ',
    };

    expect(exportGeneratedData(dataset, [{ Category: 'Login' }], 'csv')).toEqual({
      ok: true,
      filename: 'food-menu-results.csv',
    });
  });
});
