import { resetTestDataStore, useTestDataStore } from '@/stores/testDataStore';

describe('testDataStore', () => {
  beforeEach(() => {
    resetTestDataStore();
  });

  it('creates datasets and nested parent/child values', () => {
    const dataset = useTestDataStore.getState().createDataset({
      name: 'QA Matrix',
      description: 'Auth and payments',
    });
    expect(dataset?.name).toBe('QA Matrix');
    expect(useTestDataStore.getState().activeDatasetId).toBe(dataset?.id);

    const category = useTestDataStore.getState().addField(dataset!.id, { name: 'Category' });
    const login = useTestDataStore.getState().addValue(dataset!.id, category!.id, {
      name: 'Login',
    });
    const optionalNote = useTestDataStore.getState().addValue(dataset!.id, category!.id, {
      name: 'Legacy',
      optional: true,
    });

    const stored = useTestDataStore.getState().datasets[0];
    expect(stored?.fields[0]?.name).toBe('Category');
    expect(stored?.fields[0]?.values.map((value) => value.name)).toEqual(['Login', 'Legacy']);
    expect(login?.optional).toBe(false);
    expect(optionalNote?.optional).toBe(true);
  });

  it('deletes datasets and clears the active selection', () => {
    const dataset = useTestDataStore.getState().createDataset({ name: 'Temp' });
    useTestDataStore.getState().deleteDataset(dataset!.id);
    expect(useTestDataStore.getState().datasets).toEqual([]);
    expect(useTestDataStore.getState().activeDatasetId).toBeNull();
  });
});
