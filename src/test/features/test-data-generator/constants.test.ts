import {
  OMIT_FIELD_ID,
  TEST_DATA_EXPORT_FORMAT,
  TEST_DATA_LIMITS,
  TEST_DATA_MESSAGES,
  TEST_DATA_RECORD_COUNTS,
} from '@/features/test-data-generator/constants';

describe('TEST_DATA_MESSAGES', () => {
  it('exposes static page and editor copy', () => {
    expect(TEST_DATA_MESSAGES.title).toBe('Test data generator');
    expect(TEST_DATA_MESSAGES.description).toContain('hierarchical datasets');
    expect(TEST_DATA_MESSAGES.chooseDataset).toBe('Choose a dataset to edit or generate from.');
    expect(TEST_DATA_MESSAGES.noDatasetsTitle).toBe('No test datasets yet');
    expect(TEST_DATA_MESSAGES.noDatasetsDescription).toContain('Create a dataset');
    expect(TEST_DATA_MESSAGES.createDataset).toBe('Create dataset');
    expect(TEST_DATA_MESSAGES.createDatasetTitle).toBe('Create test dataset');
    expect(TEST_DATA_MESSAGES.datasetName).toBe('Dataset name');
    expect(TEST_DATA_MESSAGES.datasetDescription).toBe('Description');
    expect(TEST_DATA_MESSAGES.changeDataset).toBe('Change dataset');
    expect(TEST_DATA_MESSAGES.deleteDataset).toBe('Delete dataset');
    expect(TEST_DATA_MESSAGES.fieldsTitle).toBe('Dataset structure');
    expect(TEST_DATA_MESSAGES.fieldsHint).toContain('Parents are dimensions');
    expect(TEST_DATA_MESSAGES.addParent).toBe('Add parent field');
    expect(TEST_DATA_MESSAGES.addChild).toBe('Add child');
    expect(TEST_DATA_MESSAGES.addOptionalChild).toBe('Add optional child');
    expect(TEST_DATA_MESSAGES.parentName).toBe('Parent name');
    expect(TEST_DATA_MESSAGES.childName).toBe('Child name');
    expect(TEST_DATA_MESSAGES.weight).toBe('Weight');
    expect(TEST_DATA_MESSAGES.optionalField).toBe('Optional field');
    expect(TEST_DATA_MESSAGES.optionalFieldHint).toContain('may be omitted');
    expect(TEST_DATA_MESSAGES.optionalValue).toBe('Optional');
    expect(TEST_DATA_MESSAGES.requiredValue).toBe('Required');
    expect(TEST_DATA_MESSAGES.enabled).toBe('Enabled');
    expect(TEST_DATA_MESSAGES.noFieldsTitle).toBe('No parent fields yet');
    expect(TEST_DATA_MESSAGES.noFieldsDescription).toContain('Add a parent field');
    expect(TEST_DATA_MESSAGES.generateTitle).toBe('Generate combinations');
    expect(TEST_DATA_MESSAGES.generateHint).toContain('hierarchical path');
    expect(TEST_DATA_MESSAGES.generateBatch).toBe('Generate');
    expect(TEST_DATA_MESSAGES.cancelGeneration).toBe('Cancel');
    expect(TEST_DATA_MESSAGES.resultCount).toBe('Number of records');
    expect(TEST_DATA_MESSAGES.uniqueResults).toBe('Avoid duplicate combinations');
    expect(TEST_DATA_MESSAGES.allowDuplicates).toBe('Allow duplicates');
    expect(TEST_DATA_MESSAGES.resultsTitle).toBe('Generated results');
    expect(TEST_DATA_MESSAGES.pathColumn).toBe('Combination');
    expect(TEST_DATA_MESSAGES.noResults).toContain('Generate a combination');
    expect(TEST_DATA_MESSAGES.exportJson).toBe('Export JSON');
    expect(TEST_DATA_MESSAGES.exportCsv).toBe('Export CSV');
    expect(TEST_DATA_MESSAGES.exportFailed).toBe('Could not download the export file.');
    expect(TEST_DATA_MESSAGES.nameRequired).toBe('Name is required.');
    expect(TEST_DATA_MESSAGES.countInvalid).toBe('Choose 1, 10, 50, 100, or 1000 records.');
    expect(TEST_DATA_MESSAGES.noEnabledFields).toContain('enabled parent field');
    expect(TEST_DATA_MESSAGES.emptyGeneration).toContain('No combinations could be generated');
  });

  it('formats dataset lifecycle messages', () => {
    expect(TEST_DATA_MESSAGES.deleteDatasetConfirm('QA Matrix')).toBe(
      'Delete “QA Matrix” and all of its fields?',
    );
    expect(TEST_DATA_MESSAGES.datasetCreated('QA Matrix')).toBe('Created dataset “QA Matrix”.');
    expect(TEST_DATA_MESSAGES.datasetDeleted('QA Matrix')).toBe('Deleted “QA Matrix”.');
  });

  it('formats field and value messages', () => {
    expect(TEST_DATA_MESSAGES.noValues('Category')).toBe('No child values under Category yet.');
    expect(TEST_DATA_MESSAGES.fieldAdded('Category')).toBe('Added parent “Category”.');
    expect(TEST_DATA_MESSAGES.valueAdded('Login', 'Category')).toBe('Added “Login” under Category.');
    expect(TEST_DATA_MESSAGES.editField('Category')).toBe('Edit Category');
    expect(TEST_DATA_MESSAGES.deleteField('Category')).toBe('Delete Category');
    expect(TEST_DATA_MESSAGES.deleteValue('Login')).toBe('Delete Login');
    expect(TEST_DATA_MESSAGES.toggleField('Category', true)).toBe('Disable Category');
    expect(TEST_DATA_MESSAGES.toggleField('Category', false)).toBe('Enable Category');
    expect(TEST_DATA_MESSAGES.toggleValue('Login', true)).toBe('Disable Login');
    expect(TEST_DATA_MESSAGES.toggleValue('Login', false)).toBe('Enable Login');
  });

  it('formats generation progress and outcome messages', () => {
    expect(TEST_DATA_MESSAGES.progressLabel(3, 10)).toBe('Generating 3 of 10…');
    expect(TEST_DATA_MESSAGES.cancelledPartial(1)).toBe('Generation cancelled after 1 record.');
    expect(TEST_DATA_MESSAGES.cancelledPartial(4)).toBe('Generation cancelled after 4 records.');
    expect(TEST_DATA_MESSAGES.uniqueExhausted(1, 10)).toBe(
      'Generated 1 unique record (requested 10).',
    );
    expect(TEST_DATA_MESSAGES.uniqueExhausted(2, 10)).toBe(
      'Generated 2 unique records (requested 10).',
    );
    expect(TEST_DATA_MESSAGES.exportSuccess('food-menu-results.csv')).toBe(
      'Exported food-menu-results.csv',
    );
  });
});

describe('TEST_DATA_RECORD_COUNTS', () => {
  it('lists the supported batch sizes in ascending order', () => {
    expect(TEST_DATA_RECORD_COUNTS).toEqual([1, 10, 50, 100, 1000]);
  });
});

describe('TEST_DATA_LIMITS', () => {
  it('exposes generation and structure caps used by the feature', () => {
    expect(TEST_DATA_LIMITS.maxResults).toBe(1000);
    expect(TEST_DATA_LIMITS.maxDatasets).toBe(50);
    expect(TEST_DATA_LIMITS.maxFields).toBe(40);
    expect(TEST_DATA_LIMITS.maxValuesPerField).toBe(100);
    expect(TEST_DATA_LIMITS.omitTokenWeight).toBe(1);
    expect(TEST_DATA_LIMITS.batchChunkSize).toBe(50);
    expect(TEST_DATA_LIMITS.maxResults).toBe(TEST_DATA_RECORD_COUNTS.at(-1));
  });
});

describe('TEST_DATA_EXPORT_FORMAT', () => {
  it('uses the spinflow test-data document format id', () => {
    expect(TEST_DATA_EXPORT_FORMAT).toBe('spinflow.test-data');
  });
});

describe('OMIT_FIELD_ID', () => {
  it('uses a stable synthetic id for omitted optional fields', () => {
    expect(OMIT_FIELD_ID).toBe('__omit__');
  });
});
