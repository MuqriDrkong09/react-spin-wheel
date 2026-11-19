import { DatasetPicker } from '@/features/test-data-generator/components/DatasetPicker';
import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import type { TestDataset, TestField } from '@/features/test-data-generator/types';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const stamp = '2026-01-01T00:00:00.000Z';

function field(name: string): TestField {
  return {
    id: name.toLowerCase(),
    name,
    weight: 1,
    enabled: true,
    optional: false,
    values: [],
    createdAt: stamp,
    updatedAt: stamp,
  };
}

function dataset(
  overrides: Partial<TestDataset> & Pick<TestDataset, 'id' | 'name'>,
): TestDataset {
  return {
    description: undefined,
    fields: [],
    createdAt: stamp,
    updatedAt: stamp,
    ...overrides,
  };
}

describe('DatasetPicker', () => {
  it('lists datasets with descriptions and plural field counts', () => {
    renderWithProviders(
      <DatasetPicker
        datasets={[
          dataset({
            id: 'alpha',
            name: 'Alpha',
            description: 'First tree',
            fields: [field('Category'), field('User Type')],
          }),
          dataset({
            id: 'beta',
            name: 'Beta',
            fields: [field('Environment')],
          }),
        ]}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.getByText(TEST_DATA_MESSAGES.chooseDataset)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alpha', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Beta', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('First tree')).toBeInTheDocument();
    expect(screen.getByText('2 parent fields')).toBeInTheDocument();
    expect(screen.getByText('1 parent field')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dataset Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dataset Beta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: TEST_DATA_MESSAGES.createDataset })).toBeInTheDocument();
  });

  it('omits description text when a dataset has no description', () => {
    renderWithProviders(
      <DatasetPicker
        datasets={[dataset({ id: 'plain', name: 'Plain', fields: [] })]}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Plain', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('0 parent fields')).toBeInTheDocument();
    expect(screen.queryByText('First tree')).not.toBeInTheDocument();
  });

  it('calls onSelect with the dataset id when a card is opened', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderWithProviders(
      <DatasetPicker
        datasets={[
          dataset({ id: 'alpha', name: 'Alpha' }),
          dataset({ id: 'beta', name: 'Beta' }),
        ]}
        onSelect={onSelect}
        onCreate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Open dataset Beta' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('beta');
  });

  it('calls onCreate when the create dataset button is clicked', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    renderWithProviders(
      <DatasetPicker datasets={[dataset({ id: 'alpha', name: 'Alpha' })]} onSelect={vi.fn()} onCreate={onCreate} />,
    );

    await user.click(screen.getByRole('button', { name: TEST_DATA_MESSAGES.createDataset }));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('still shows create when there are no datasets to list', () => {
    renderWithProviders(<DatasetPicker datasets={[]} onSelect={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByText(TEST_DATA_MESSAGES.chooseDataset)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: TEST_DATA_MESSAGES.createDataset })).toBeInTheDocument();
  });
});
