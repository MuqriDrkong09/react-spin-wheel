import { useState } from 'react';

import { DashboardToolbar } from '@/features/dashboard/components/DashboardToolbar';
import * as dashboardConstants from '@/features/dashboard/constants';
import {
  CATEGORY_FILTER_ALL,
  WHEEL_SORT,
  WHEEL_SORT_LABELS,
} from '@/features/dashboard/constants';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

function renderToolbar(
  overrides: Partial<Parameters<typeof DashboardToolbar>[0]> = {},
) {
  const props = {
    search: '',
    onSearchChange: vi.fn(),
    category: CATEGORY_FILTER_ALL,
    onCategoryChange: vi.fn(),
    categoryOptions: [CATEGORY_FILTER_ALL, 'Food', 'Decisions'],
    sort: WHEEL_SORT.updatedDesc,
    onSortChange: vi.fn(),
    ...overrides,
  };

  renderWithProviders(<DashboardToolbar {...props} />);
  return props;
}

describe('DashboardToolbar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders search, category, and sort controls', () => {
    renderToolbar({ search: 'pizza', category: 'Food' });

    expect(screen.getByLabelText('Search wheels')).toHaveValue('pizza');
    expect(screen.getByPlaceholderText('Search by name')).toBeInTheDocument();
    expect(screen.getByTestId('SearchIcon')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Food');
    expect(screen.getByRole('combobox', { name: 'Sort' })).toHaveTextContent(
      WHEEL_SORT_LABELS[WHEEL_SORT.updatedDesc],
    );
  });

  it('notifies when the search value changes', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    function SearchHarness() {
      const [search, setSearch] = useState('');

      return (
        <DashboardToolbar
          search={search}
          onSearchChange={(value) => {
            onSearchChange(value);
            setSearch(value);
          }}
          category={CATEGORY_FILTER_ALL}
          onCategoryChange={vi.fn()}
          categoryOptions={[CATEGORY_FILTER_ALL, 'Food']}
          sort={WHEEL_SORT.updatedDesc}
          onSortChange={vi.fn()}
        />
      );
    }

    renderWithProviders(<SearchHarness />);
    await user.type(screen.getByLabelText('Search wheels'), 'chore');

    expect(screen.getByLabelText('Search wheels')).toHaveValue('chore');
    expect(onSearchChange).toHaveBeenLastCalledWith('chore');
  });

  it('labels the all-categories option and reports a named category', async () => {
    const user = userEvent.setup();
    const { onCategoryChange } = renderToolbar();

    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    expect(screen.getByRole('option', { name: 'All categories' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Food' }));

    expect(onCategoryChange).toHaveBeenCalledWith('Food');
  });

  it('reports the all-categories filter value', async () => {
    const user = userEvent.setup();
    const { onCategoryChange } = renderToolbar({ category: 'Food' });

    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    await user.click(screen.getByRole('option', { name: 'All categories' }));

    expect(onCategoryChange).toHaveBeenCalledWith(CATEGORY_FILTER_ALL);
  });

  it('reports a valid sort change', async () => {
    const user = userEvent.setup();
    const { onSortChange } = renderToolbar();

    await user.click(screen.getByRole('combobox', { name: 'Sort' }));
    for (const label of Object.values(WHEEL_SORT_LABELS)) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
    }
    await user.click(screen.getByRole('option', { name: WHEEL_SORT_LABELS[WHEEL_SORT.nameAsc] }));

    expect(onSortChange).toHaveBeenCalledWith(WHEEL_SORT.nameAsc);
  });

  it('ignores a sort value that fails the wheel-sort guard', async () => {
    const user = userEvent.setup();
    vi.spyOn(dashboardConstants, 'isWheelSort').mockReturnValue(false);
    const { onSortChange } = renderToolbar();

    await user.click(screen.getByRole('combobox', { name: 'Sort' }));
    await user.click(screen.getByRole('option', { name: WHEEL_SORT_LABELS[WHEEL_SORT.nameAsc] }));

    expect(onSortChange).not.toHaveBeenCalled();
  });
});
