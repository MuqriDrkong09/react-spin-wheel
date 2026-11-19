import { ROUTES, withTestDatasetId } from '@/constants/routes';
import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import { downloadFile } from '@/features/test-data-generator/utils/downloadFile';
import { resetTestDataStore, useTestDataStore } from '@/stores/testDataStore';
import { renderApp, screen, userEvent, waitFor, within } from '@/test/test-utils';

vi.mock('@/features/test-data-generator/utils/downloadFile', () => ({
  downloadFile: vi.fn(),
}));

const downloadFileMock = vi.mocked(downloadFile);

function seedDataset(name = 'QA Matrix', description?: string) {
  const dataset = useTestDataStore.getState().createDataset({ name, description })!;
  return dataset;
}

function seedHierarchyDataset() {
  const dataset = seedDataset('Food Menu', 'Sample tree');
  const category = useTestDataStore.getState().addField(dataset.id, { name: 'Category' })!;
  const product = useTestDataStore.getState().addField(dataset.id, { name: 'Product' })!;
  const size = useTestDataStore.getState().addField(dataset.id, { name: 'Size' })!;

  useTestDataStore.getState().addValue(dataset.id, category.id, { name: 'Pizza' });
  useTestDataStore.getState().addValue(dataset.id, category.id, { name: 'Burger' });
  useTestDataStore.getState().addValue(dataset.id, product.id, { name: 'Chicken Pepperoni' });
  useTestDataStore.getState().addValue(dataset.id, product.id, { name: 'Beef Pepperoni' });
  useTestDataStore.getState().addValue(dataset.id, size.id, { name: 'Large' });
  useTestDataStore.getState().addValue(dataset.id, size.id, { name: 'Medium' });

  return dataset;
}

function seedSingleValueDataset() {
  const dataset = seedDataset('Tiny Space');
  const category = useTestDataStore.getState().addField(dataset.id, { name: 'Category' })!;
  useTestDataStore.getState().addValue(dataset.id, category.id, { name: 'Login' });
  useTestDataStore.getState().addValue(dataset.id, category.id, { name: 'Payment' });
  return dataset;
}

async function openDataset(datasetId: string) {
  return renderApp({
    initialEntries: [withTestDatasetId(ROUTES.testDataGenerator, datasetId)],
  });
}

describe('TestDataGeneratorScreen', () => {
  beforeEach(() => {
    resetTestDataStore();
    downloadFileMock.mockReset();
    downloadFileMock.mockReturnValue(true);
  });

  it('shows empty state and creates a dataset from the header action', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: [ROUTES.testDataGenerator] });

    expect(screen.getByRole('heading', { name: TEST_DATA_MESSAGES.title, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(TEST_DATA_MESSAGES.description)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: TEST_DATA_MESSAGES.noDatasetsTitle })).toBeInTheDocument();
    expect(screen.getByText(TEST_DATA_MESSAGES.noDatasetsDescription)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.createDataset }));
    const createDialog = await screen.findByRole('dialog', {
      name: TEST_DATA_MESSAGES.createDatasetTitle,
    });
    await user.type(within(createDialog).getByLabelText(/dataset name/i), 'QA Matrix');
    await user.type(within(createDialog).getByLabelText(/description/i), 'Auth flows');
    await user.click(within(createDialog).getByRole('button', { name: TEST_DATA_MESSAGES.createDataset }));

    expect(await screen.findByText(`Edit and generate from QA Matrix.`)).toBeInTheDocument();
    expect(
      await screen.findByText(TEST_DATA_MESSAGES.datasetCreated('QA Matrix')),
    ).toBeInTheDocument();
    expect(useTestDataStore.getState().datasets[0]?.description).toBe('Auth flows');
  });

  it('lists datasets in the picker and opens the selected dataset', async () => {
    const user = userEvent.setup();
    const first = seedDataset('Alpha', 'First tree');
    seedDataset('Beta');

    await renderApp({ initialEntries: [ROUTES.testDataGenerator] });

    expect(screen.getByRole('heading', { name: 'Alpha', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Beta', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('First tree')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dataset Alpha' })).toBeInTheDocument();
    expect(screen.getAllByText(TEST_DATA_MESSAGES.chooseDataset).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Open dataset Alpha' }));

    expect(await screen.findByText(`Edit and generate from Alpha.`)).toBeInTheDocument();
    expect(useTestDataStore.getState().activeDatasetId).toBe(first.id);
  });

  it('shows missing-dataset empty state for unknown dataset ids', async () => {
    const user = userEvent.setup();
    seedDataset('Alive');

    await renderApp({
      initialEntries: [`${ROUTES.testDataGenerator}?datasetId=missing-dataset`],
    });

    expect(screen.getByRole('heading', { name: 'Dataset not found', level: 2 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.createDataset }));

    expect(await screen.findByRole('heading', { name: 'Alive', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dataset Alive' })).toBeInTheDocument();
  });

  it('creates hierarchy, generates combinations, and exports json and csv', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: [ROUTES.testDataGenerator] });

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
      expect.stringMatching(/^Parent\n(?:Login|Legacy)\n$/),
      'text/csv;charset=utf-8',
    );

    expect(useTestDataStore.getState().datasets[0]?.fields[0]?.values).toHaveLength(2);
  }, 30_000);

  it('exports flattened Parent/Child/Grandchild csv for depth-3 hierarchies', async () => {
    const user = userEvent.setup();
    const dataset = seedHierarchyDataset();
    await openDataset(dataset.id);

    await user.click(screen.getByRole('button', { name: '1 records' }));
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.generateBatch }));

    const resultsTable = await screen.findByRole('table', { name: TEST_DATA_MESSAGES.resultsTitle });
    expect(
      within(resultsTable).getByText((content) => content.includes(' → ')),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.exportCsv }));
    expect(downloadFileMock).toHaveBeenCalledWith(
      'food-menu-results.csv',
      expect.stringMatching(/^Parent,Child,Grandchild\n.+\n$/),
      'text/csv;charset=utf-8',
    );
  });

  it('toggles and deletes fields/values, and surfaces generate validation errors', async () => {
    const user = userEvent.setup();
    const dataset = seedSingleValueDataset();
    await openDataset(dataset.id);

    expect(screen.getByRole('heading', { name: 'Category', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();

    await user.click(screen.getByLabelText(TEST_DATA_MESSAGES.toggleValue('Payment', true)));
    expect(screen.getByText('Disabled')).toBeInTheDocument();

    await user.click(screen.getByLabelText(TEST_DATA_MESSAGES.deleteValue('Payment')));
    expect(screen.queryByText('Payment')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(TEST_DATA_MESSAGES.toggleField('Category', true)));
    expect(screen.getByText('Disabled')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1 records' }));
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.generateBatch }));

    expect(await screen.findByRole('alert')).toHaveTextContent(TEST_DATA_MESSAGES.noEnabledFields);

    await user.click(screen.getByLabelText(TEST_DATA_MESSAGES.toggleField('Category', false)));
    await user.click(screen.getByLabelText(TEST_DATA_MESSAGES.deleteField('Category')));

    expect(screen.queryByRole('heading', { name: 'Category', level: 3 })).not.toBeInTheDocument();
    expect(screen.getByText(TEST_DATA_MESSAGES.noFieldsDescription)).toBeInTheDocument();
  });

  it('shows unique-exhausted info when fewer unique rows exist than requested', async () => {
    const user = userEvent.setup();
    const dataset = seedSingleValueDataset();
    await openDataset(dataset.id);

    await user.click(screen.getByRole('button', { name: '10 records' }));
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.generateBatch }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      TEST_DATA_MESSAGES.uniqueExhausted(2, 10),
    );
    expect(screen.getByRole('heading', { name: /Generated results \(2\)/i })).toBeInTheDocument();
  });

  it('allows duplicate combinations when unique mode is turned off', async () => {
    const user = userEvent.setup();
    const dataset = seedSingleValueDataset();
    await openDataset(dataset.id);

    await user.click(screen.getByLabelText(TEST_DATA_MESSAGES.uniqueResults));
    expect(screen.getByText(TEST_DATA_MESSAGES.allowDuplicates)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '10 records' }));
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.generateBatch }));

    expect(
      await screen.findByRole('heading', { name: /Generated results \(10\)/i }),
    ).toBeInTheDocument();
  });

  it('cancels an in-flight batch generation and keeps partial results', async () => {
    const user = userEvent.setup();
    const dataset = seedHierarchyDataset();
    await openDataset(dataset.id);

    await user.click(screen.getByLabelText(TEST_DATA_MESSAGES.uniqueResults));
    await user.click(screen.getByRole('button', { name: '1000 records' }));
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.generateBatch }));

    const cancelButton = await screen.findByRole('button', {
      name: TEST_DATA_MESSAGES.cancelGeneration,
    });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Generation cancelled after/i);
    });
    expect(screen.getByRole('heading', { name: /Generated results \(/i })).toBeInTheDocument();
  }, 30_000);

  it('reports export failures without changing generated results', async () => {
    const user = userEvent.setup();
    const dataset = seedSingleValueDataset();
    await openDataset(dataset.id);

    await user.click(screen.getByRole('button', { name: '1 records' }));
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.generateBatch }));
    expect(await screen.findByRole('table', { name: TEST_DATA_MESSAGES.resultsTitle })).toBeInTheDocument();

    downloadFileMock.mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.exportCsv }));

    expect(await screen.findByRole('alert')).toHaveTextContent(TEST_DATA_MESSAGES.exportFailed);
    expect(screen.getByRole('table', { name: TEST_DATA_MESSAGES.resultsTitle })).toBeInTheDocument();
  });

  it('changes dataset selection and deletes a dataset after confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm');
    const keep = seedDataset('Keep Me');
    const remove = seedDataset('Remove Me');

    await openDataset(remove.id);
    expect(screen.getByText(`Edit and generate from Remove Me.`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.changeDataset }));
    expect(await screen.findByRole('button', { name: 'Open dataset Keep Me' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dataset Remove Me' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open dataset Remove Me' }));
    expect(await screen.findByText(`Edit and generate from Remove Me.`)).toBeInTheDocument();

    confirmSpy.mockReturnValueOnce(false);
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.deleteDataset }));
    expect(useTestDataStore.getState().datasets.some((entry) => entry.id === remove.id)).toBe(true);
    expect(screen.getByText(`Edit and generate from Remove Me.`)).toBeInTheDocument();

    confirmSpy.mockReturnValueOnce(true);
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.deleteDataset }));

    expect(
      await screen.findByText(TEST_DATA_MESSAGES.datasetDeleted('Remove Me')),
    ).toBeInTheDocument();
    expect(useTestDataStore.getState().datasets.map((entry) => entry.id)).toEqual([keep.id]);
    expect(await screen.findByRole('heading', { name: 'Keep Me', level: 2 })).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('adds an optional parent field from the structure form', async () => {
    const user = userEvent.setup();
    const dataset = seedDataset('Optional Parents');
    await openDataset(dataset.id);

    const parentForm = screen.getByRole('form', { name: TEST_DATA_MESSAGES.addParent });
    await user.type(within(parentForm).getByLabelText(/parent name/i), 'Notes');
    await user.click(within(parentForm).getByLabelText(TEST_DATA_MESSAGES.optionalField));
    await user.click(within(parentForm).getByRole('button', { name: TEST_DATA_MESSAGES.addParent }));

    expect(await screen.findByRole('heading', { name: 'Notes', level: 3 })).toBeInTheDocument();
    expect(screen.getAllByText(TEST_DATA_MESSAGES.optionalField).length).toBeGreaterThan(0);
    expect(
      await screen.findByText(TEST_DATA_MESSAGES.fieldAdded('Notes')),
    ).toBeInTheDocument();
  });

  it('cancels the create-dataset dialog without creating a dataset', async () => {
    const user = userEvent.setup();
    seedDataset('Existing');
    await renderApp({ initialEntries: [ROUTES.testDataGenerator] });

    const createButtons = screen.getAllByRole('button', { name: TEST_DATA_MESSAGES.createDataset });
    expect(createButtons.length).toBeGreaterThanOrEqual(2);
    await user.click(createButtons[0]!);

    const createDialog = await screen.findByRole('dialog', {
      name: TEST_DATA_MESSAGES.createDatasetTitle,
    });
    await user.type(within(createDialog).getByLabelText(/dataset name/i), 'Should Not Persist');
    await user.click(within(createDialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: TEST_DATA_MESSAGES.createDatasetTitle })).not.toBeInTheDocument();
    });
    expect(useTestDataStore.getState().datasets.map((entry) => entry.name)).toEqual(['Existing']);
    expect(screen.getByRole('heading', { name: 'Existing', level: 2 })).toBeInTheDocument();
  });

  it('opens create from the page header while the dataset picker is visible', async () => {
    const user = userEvent.setup();
    seedDataset('Existing');
    await renderApp({ initialEntries: [ROUTES.testDataGenerator] });

    expect(screen.getAllByText(TEST_DATA_MESSAGES.chooseDataset).length).toBeGreaterThan(0);
    const createButtons = screen.getAllByRole('button', { name: TEST_DATA_MESSAGES.createDataset });
    await user.click(createButtons[0]!);

    const createDialog = await screen.findByRole('dialog', {
      name: TEST_DATA_MESSAGES.createDatasetTitle,
    });
    await user.type(within(createDialog).getByLabelText(/dataset name/i), 'From Header');
    await user.click(within(createDialog).getByRole('button', { name: TEST_DATA_MESSAGES.createDataset }));

    expect(await screen.findByText(`Edit and generate from From Header.`)).toBeInTheDocument();
    expect(useTestDataStore.getState().datasets.some((entry) => entry.name === 'From Header')).toBe(
      true,
    );
  });

  it('dismisses the success snackbar', async () => {
    const user = userEvent.setup();
    const dataset = seedDataset('Snack Close');
    await openDataset(dataset.id);

    const parentForm = screen.getByRole('form', { name: TEST_DATA_MESSAGES.addParent });
    await user.type(within(parentForm).getByLabelText(/parent name/i), 'Category');
    await user.click(within(parentForm).getByRole('button', { name: TEST_DATA_MESSAGES.addParent }));

    const success = await screen.findByText(TEST_DATA_MESSAGES.fieldAdded('Category'));
    const alert = success.closest('[role="alert"]');
    expect(alert).not.toBeNull();
    await user.click(within(alert as HTMLElement).getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByText(TEST_DATA_MESSAGES.fieldAdded('Category'))).not.toBeInTheDocument();
    });
  });

  it('shows generation progress while a batch is running', async () => {
    const user = userEvent.setup();
    const dataset = seedHierarchyDataset();
    await openDataset(dataset.id);

    await user.click(screen.getByLabelText(TEST_DATA_MESSAGES.uniqueResults));
    await user.click(screen.getByRole('button', { name: '1000 records' }));
    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.generateBatch }));

    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/Generating \d+ of 1000/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.cancelGeneration }));
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  }, 30_000);
});
