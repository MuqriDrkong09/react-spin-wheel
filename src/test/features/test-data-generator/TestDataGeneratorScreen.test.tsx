import { ROUTES } from '@/constants/routes';
import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import { downloadFile } from '@/features/test-data-generator/utils/downloadFile';
import { resetTestDataStore, useTestDataStore } from '@/stores/testDataStore';
import { renderApp, screen, userEvent, within } from '@/test/test-utils';

vi.mock('@/features/test-data-generator/utils/downloadFile', () => ({
  downloadFile: vi.fn(),
}));

const downloadFileMock = vi.mocked(downloadFile);

describe('TestDataGeneratorScreen', () => {
  beforeEach(() => {
    resetTestDataStore();
    downloadFileMock.mockReset();
    downloadFileMock.mockReturnValue(true);
  });

  it('creates a dataset, adds hierarchy, and batch-generates a combination', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: [ROUTES.testDataGenerator] });

    expect(screen.getByRole('heading', { name: TEST_DATA_MESSAGES.title, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: TEST_DATA_MESSAGES.noDatasetsTitle })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.createDataset }));
    const createDialog = await screen.findByRole('dialog', {
      name: TEST_DATA_MESSAGES.createDatasetTitle,
    });
    await user.type(within(createDialog).getByLabelText(/dataset name/i), 'QA Matrix');
    await user.click(within(createDialog).getByRole('button', { name: TEST_DATA_MESSAGES.createDataset }));

    expect(await screen.findByText(`Edit and generate from QA Matrix.`)).toBeInTheDocument();

    const parentForm = screen.getByRole('form', { name: TEST_DATA_MESSAGES.addParent });
    await user.type(within(parentForm).getByLabelText(/parent name/i), 'Category');
    await user.click(within(parentForm).getByRole('button', { name: TEST_DATA_MESSAGES.addParent }));

    expect(await screen.findByRole('heading', { name: 'Category', level: 3 })).toBeInTheDocument();

    const childForm = screen.getByRole('form', { name: `${TEST_DATA_MESSAGES.addChild} for Category` });
    await user.type(within(childForm).getByLabelText(/child name/i), 'Login');
    await user.click(within(childForm).getByRole('button', { name: TEST_DATA_MESSAGES.addChild }));

    const optionalForm = screen.getByRole('form', {
      name: `${TEST_DATA_MESSAGES.addOptionalChild} for Category`,
    });
    await user.type(within(optionalForm).getByLabelText(/child name/i), 'Legacy');
    await user.click(
      within(optionalForm).getByRole('button', { name: TEST_DATA_MESSAGES.addOptionalChild }),
    );

    expect(await screen.findByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Legacy')).toBeInTheDocument();
    expect(screen.getByText(TEST_DATA_MESSAGES.optionalValue)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1 records' }));
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.generateBatch }));

    const resultsTable = await screen.findByRole('table', { name: TEST_DATA_MESSAGES.resultsTitle });
    expect(within(resultsTable).getByRole('columnheader', { name: TEST_DATA_MESSAGES.pathColumn })).toBeInTheDocument();
    expect(
      within(resultsTable).getByText((content) => content === 'Login' || content === 'Legacy'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.exportJson }));
    expect(downloadFileMock).toHaveBeenCalledWith(
      'qa-matrix-results.json',
      expect.stringContaining('"format": "spinflow.test-data"'),
      'application/json',
    );
    expect(
      await screen.findByText(TEST_DATA_MESSAGES.exportSuccess('qa-matrix-results.json')),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.exportCsv }));
    expect(downloadFileMock).toHaveBeenCalledWith(
      'qa-matrix-results.csv',
      expect.stringContaining('Record,Combination,Category'),
      'text/csv;charset=utf-8',
    );

    expect(useTestDataStore.getState().datasets[0]?.fields[0]?.values).toHaveLength(2);
  }, 30_000);
});
