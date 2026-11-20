import { TEST_DATA_LIMITS } from '@/features/test-data-generator/constants';
import type { TestDataset, TestField, TestValue } from '@/features/test-data-generator/types';
import { resetTestDataStore, useTestDataStore } from '@/stores/testDataStore';

function store() {
  return useTestDataStore.getState();
}

function stamp() {
  return '2026-01-01T00:00:00.000Z';
}

function field(id: string, overrides: Partial<TestField> = {}): TestField {
  return {
    id,
    name: id,
    weight: 1,
    enabled: true,
    optional: false,
    values: [],
    createdAt: stamp(),
    updatedAt: stamp(),
    ...overrides,
  };
}

function value(id: string, overrides: Partial<TestValue> = {}): TestValue {
  return {
    id,
    name: id,
    weight: 1,
    enabled: true,
    optional: false,
    createdAt: stamp(),
    updatedAt: stamp(),
    ...overrides,
  };
}

describe('testDataStore', () => {
  beforeEach(() => {
    resetTestDataStore();
  });

  it('creates datasets and nested parent/child values', () => {
    const dataset = store().createDataset({
      name: 'QA Matrix',
      description: 'Auth and payments',
    });
    expect(dataset?.name).toBe('QA Matrix');
    expect(store().activeDatasetId).toBe(dataset?.id);

    const category = store().addField(dataset!.id, { name: 'Category' });
    const login = store().addValue(dataset!.id, category!.id, {
      name: 'Login',
    });
    const optionalNote = store().addValue(dataset!.id, category!.id, {
      name: 'Legacy',
      optional: true,
    });

    const stored = store().datasets[0];
    expect(stored?.fields[0]?.name).toBe('Category');
    expect(stored?.fields[0]?.values.map((entry) => entry.name)).toEqual(['Login', 'Legacy']);
    expect(login?.optional).toBe(false);
    expect(optionalNote?.optional).toBe(true);
  });

  it('trims dataset input and rejects an empty name', () => {
    expect(store().createDataset({ name: '   ' })).toBeUndefined();
    expect(store().datasets).toEqual([]);

    const dataset = store().createDataset({
      name: '  Menu  ',
      description: '  Lunch  ',
    });
    expect(dataset).toMatchObject({
      name: 'Menu',
      description: 'Lunch',
      fields: [],
    });

    const blankDescription = store().createDataset({
      name: 'Blank desc',
      description: '   ',
    });
    expect(blankDescription?.description).toBeUndefined();
  });

  it('prepends new datasets and activates them', () => {
    const first = store().createDataset({ name: 'First' });
    const second = store().createDataset({ name: 'Second' });

    expect(store().datasets.map((dataset) => dataset.name)).toEqual(['Second', 'First']);
    expect(store().activeDatasetId).toBe(second?.id);
    expect(store().activeDatasetId).not.toBe(first?.id);
  });

  it('rejects creating more datasets than the limit', () => {
    const datasets: TestDataset[] = Array.from({ length: TEST_DATA_LIMITS.maxDatasets }, (_, index) => ({
      id: `ds-${index}`,
      name: `Dataset ${index}`,
      fields: [],
      createdAt: stamp(),
      updatedAt: stamp(),
    }));
    useTestDataStore.setState({ datasets, activeDatasetId: datasets[0]?.id ?? null });

    expect(store().createDataset({ name: 'Overflow' })).toBeUndefined();
    expect(store().datasets).toHaveLength(TEST_DATA_LIMITS.maxDatasets);
  });

  it('updates dataset name and description', () => {
    const dataset = store().createDataset({ name: 'Menu', description: 'Lunch' });

    store().updateDataset(dataset!.id, { name: '  Dinner  ', description: '  Evening  ' });
    expect(store().datasets[0]).toMatchObject({
      name: 'Dinner',
      description: 'Evening',
    });

    store().updateDataset(dataset!.id, { name: '   ' });
    expect(store().datasets[0]?.name).toBe('Dinner');

    store().updateDataset(dataset!.id, { description: '   ' });
    expect(store().datasets[0]?.description).toBeUndefined();

    store().updateDataset(dataset!.id, {});
    expect(store().datasets[0]?.name).toBe('Dinner');
  });

  it('deletes datasets and clears the active selection only when needed', () => {
    const first = store().createDataset({ name: 'Temp' });
    const second = store().createDataset({ name: 'Keep' });

    store().deleteDataset(first!.id);
    expect(store().datasets.map((dataset) => dataset.id)).toEqual([second!.id]);
    expect(store().activeDatasetId).toBe(second!.id);

    store().deleteDataset(second!.id);
    expect(store().datasets).toEqual([]);
    expect(store().activeDatasetId).toBeNull();
  });

  it('sets the active dataset and ignores unknown ids', () => {
    const first = store().createDataset({ name: 'First' });
    const second = store().createDataset({ name: 'Second' });

    store().setActiveDataset(first!.id);
    expect(store().activeDatasetId).toBe(first!.id);

    store().setActiveDataset('missing');
    expect(store().activeDatasetId).toBe(first!.id);

    store().setActiveDataset(null);
    expect(store().activeDatasetId).toBeNull();

    store().setActiveDataset(second!.id);
    expect(store().activeDatasetId).toBe(second!.id);
  });

  it('adds fields with defaults and custom options', () => {
    const dataset = store().createDataset({ name: 'Menu' });

    expect(store().addField(dataset!.id, { name: '   ' })).toBeUndefined();
    expect(store().addField('missing', { name: 'Cuisine' })).toBeUndefined();

    const cuisine = store().addField(dataset!.id, { name: '  Cuisine  ' });
    expect(cuisine).toMatchObject({
      name: 'Cuisine',
      weight: 1,
      enabled: true,
      optional: false,
      values: [],
    });

    const spicy = store().addField(dataset!.id, {
      name: 'Spicy',
      weight: 3,
      enabled: false,
      optional: true,
    });
    expect(spicy).toMatchObject({
      name: 'Spicy',
      weight: 3,
      enabled: false,
      optional: true,
    });
    expect(store().datasets[0]?.fields).toHaveLength(2);
  });

  it('rejects adding more fields than the limit', () => {
    const dataset = store().createDataset({ name: 'Menu' });
    useTestDataStore.setState({
      datasets: [
        {
          ...dataset!,
          fields: Array.from({ length: TEST_DATA_LIMITS.maxFields }, (_, index) =>
            field(`f-${index}`),
          ),
        },
      ],
    });

    expect(store().addField(dataset!.id, { name: 'Overflow' })).toBeUndefined();
    expect(store().datasets[0]?.fields).toHaveLength(TEST_DATA_LIMITS.maxFields);
  });

  it('updates and deletes fields', () => {
    const dataset = store().createDataset({ name: 'Menu' });
    const cuisine = store().addField(dataset!.id, { name: 'Cuisine' });

    store().updateField(dataset!.id, cuisine!.id, {
      name: '  Region  ',
      weight: 2,
      optional: true,
      enabled: false,
    });
    expect(store().datasets[0]?.fields[0]).toMatchObject({
      name: 'Region',
      weight: 2,
      optional: true,
      enabled: false,
    });

    store().updateField(dataset!.id, cuisine!.id, { name: '   ' });
    expect(store().datasets[0]?.fields[0]?.name).toBe('Region');

    store().deleteField(dataset!.id, cuisine!.id);
    expect(store().datasets[0]?.fields).toEqual([]);
  });

  it('adds values with defaults and custom options', () => {
    const dataset = store().createDataset({ name: 'Menu' });
    const cuisine = store().addField(dataset!.id, { name: 'Cuisine' });

    expect(store().addValue(dataset!.id, cuisine!.id, { name: '   ' })).toBeUndefined();
    expect(store().addValue(dataset!.id, 'missing', { name: 'Italian' })).toBeUndefined();
    expect(store().addValue('missing', cuisine!.id, { name: 'Italian' })).toBeUndefined();

    const italian = store().addValue(dataset!.id, cuisine!.id, { name: '  Italian  ' });
    expect(italian).toMatchObject({
      name: 'Italian',
      weight: 1,
      enabled: true,
      optional: false,
    });

    const mexican = store().addValue(dataset!.id, cuisine!.id, {
      name: 'Mexican',
      weight: 4,
      enabled: false,
      optional: true,
    });
    expect(mexican).toMatchObject({
      name: 'Mexican',
      weight: 4,
      enabled: false,
      optional: true,
    });
    expect(store().datasets[0]?.fields[0]?.values).toHaveLength(2);
  });

  it('rejects adding more values than the per-field limit', () => {
    const dataset = store().createDataset({ name: 'Menu' });
    const cuisine = store().addField(dataset!.id, { name: 'Cuisine' });
    useTestDataStore.setState({
      datasets: [
        {
          ...dataset!,
          fields: [
            field(cuisine!.id, {
              name: 'Cuisine',
              values: Array.from({ length: TEST_DATA_LIMITS.maxValuesPerField }, (_, index) =>
                value(`v-${index}`),
              ),
            }),
          ],
        },
      ],
    });

    expect(store().addValue(dataset!.id, cuisine!.id, { name: 'Overflow' })).toBeUndefined();
    expect(store().datasets[0]?.fields[0]?.values).toHaveLength(TEST_DATA_LIMITS.maxValuesPerField);
  });

  it('updates and deletes values', () => {
    const dataset = store().createDataset({ name: 'Menu' });
    const cuisine = store().addField(dataset!.id, { name: 'Cuisine' });
    const italian = store().addValue(dataset!.id, cuisine!.id, { name: 'Italian' });
    store().addValue(dataset!.id, cuisine!.id, { name: 'Mexican' });

    store().updateValue(dataset!.id, cuisine!.id, italian!.id, {
      name: '  Rome  ',
      weight: 5,
      optional: true,
      enabled: false,
    });
    expect(store().datasets[0]?.fields[0]?.values[0]).toMatchObject({
      name: 'Rome',
      weight: 5,
      optional: true,
      enabled: false,
    });

    store().updateValue(dataset!.id, cuisine!.id, italian!.id, { name: '   ' });
    expect(store().datasets[0]?.fields[0]?.values[0]?.name).toBe('Rome');

    store().deleteValue(dataset!.id, cuisine!.id, italian!.id);
    expect(store().datasets[0]?.fields[0]?.values.map((entry) => entry.name)).toEqual(['Mexican']);
  });

  it('resets datasets and the active selection', () => {
    store().createDataset({ name: 'Menu' });
    expect(store().datasets).toHaveLength(1);

    resetTestDataStore();
    expect(store().datasets).toEqual([]);
    expect(store().activeDatasetId).toBeNull();
  });
});
