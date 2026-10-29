import { useState } from 'react';

import { HistoryToolbar } from '@/features/history/components/HistoryToolbar';
import * as historyConstants from '@/features/history/constants';
import {
  HISTORY_FILTER_ALL,
  HISTORY_MESSAGES,
  HISTORY_MODE_LABELS,
  HISTORY_SORT,
  HISTORY_SORT_LABELS,
} from '@/features/history/constants';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { SELECTION_MODE } from '@/types/wheel';

const wheels = [
  { id: 'pizza', name: 'Pizza Night' },
  { id: 'chores', name: 'Chores' },
];

function renderToolbar(overrides: Partial<Parameters<typeof HistoryToolbar>[0]> = {}) {
  const props = {
    search: '',
    onSearchChange: vi.fn(),
    wheelId: HISTORY_FILTER_ALL,
    onWheelIdChange: vi.fn(),
    wheels,
    mode: HISTORY_FILTER_ALL,
    onModeChange: vi.fn(),
    sort: HISTORY_SORT.newest,
    onSortChange: vi.fn(),
    ...overrides,
  };

  renderWithProviders(<HistoryToolbar {...props} />);
  return props;
}

describe('HistoryToolbar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders search, wheel, mode, and sort controls', () => {
    renderToolbar({ search: 'chicken', wheelId: 'pizza', mode: SELECTION_MODE.ask });

    expect(screen.getByLabelText(HISTORY_MESSAGES.searchLabel)).toHaveValue('chicken');
    expect(screen.getByPlaceholderText(HISTORY_MESSAGES.searchPlaceholder)).toBeInTheDocument();
    expect(screen.getByTestId('SearchIcon')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: HISTORY_MESSAGES.wheelFilter })).toHaveTextContent(
      'Pizza Night',
    );
    expect(screen.getByRole('combobox', { name: HISTORY_MESSAGES.modeFilter })).toHaveTextContent(
      HISTORY_MODE_LABELS[SELECTION_MODE.ask],
    );
    expect(screen.getByRole('combobox', { name: HISTORY_MESSAGES.sort })).toHaveTextContent(
      HISTORY_SORT_LABELS[HISTORY_SORT.newest],
    );
  });

  it('notifies when the search value changes', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    function SearchHarness() {
      const [search, setSearch] = useState('');

      return (
        <HistoryToolbar
          search={search}
          onSearchChange={(value) => {
            onSearchChange(value);
            setSearch(value);
          }}
          wheelId={HISTORY_FILTER_ALL}
          onWheelIdChange={vi.fn()}
          wheels={wheels}
          mode={HISTORY_FILTER_ALL}
          onModeChange={vi.fn()}
          sort={HISTORY_SORT.newest}
          onSortChange={vi.fn()}
        />
      );
    }

    renderWithProviders(<SearchHarness />);
    await user.type(screen.getByLabelText(HISTORY_MESSAGES.searchLabel), 'dishes');

    expect(screen.getByLabelText(HISTORY_MESSAGES.searchLabel)).toHaveValue('dishes');
    expect(onSearchChange).toHaveBeenLastCalledWith('dishes');
  });

  it('reports a named wheel and the all-wheels filter', async () => {
    const user = userEvent.setup();
    const { onWheelIdChange } = renderToolbar();

    await user.click(screen.getByRole('combobox', { name: HISTORY_MESSAGES.wheelFilter }));
    expect(screen.getByRole('option', { name: HISTORY_MESSAGES.allWheels })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Chores' }));
    expect(onWheelIdChange).toHaveBeenCalledWith('chores');
  });

  it('reports the all-wheels filter value', async () => {
    const user = userEvent.setup();
    const { onWheelIdChange } = renderToolbar({ wheelId: 'pizza' });

    await user.click(screen.getByRole('combobox', { name: HISTORY_MESSAGES.wheelFilter }));
    await user.click(screen.getByRole('option', { name: HISTORY_MESSAGES.allWheels }));

    expect(onWheelIdChange).toHaveBeenCalledWith(HISTORY_FILTER_ALL);
  });

  it('reports a valid mode change', async () => {
    const user = userEvent.setup();
    const { onModeChange } = renderToolbar();

    await user.click(screen.getByRole('combobox', { name: HISTORY_MESSAGES.modeFilter }));
    expect(screen.getByRole('option', { name: HISTORY_MESSAGES.allModes })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: HISTORY_MODE_LABELS[SELECTION_MODE.ask] }));

    expect(onModeChange).toHaveBeenCalledWith(SELECTION_MODE.ask);
  });

  it('reports a valid sort change', async () => {
    const user = userEvent.setup();
    const { onSortChange } = renderToolbar();

    await user.click(screen.getByRole('combobox', { name: HISTORY_MESSAGES.sort }));
    for (const label of Object.values(HISTORY_SORT_LABELS)) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
    }
    await user.click(screen.getByRole('option', { name: HISTORY_SORT_LABELS[HISTORY_SORT.oldest] }));

    expect(onSortChange).toHaveBeenCalledWith(HISTORY_SORT.oldest);
  });

  it('ignores a mode value that fails the mode-filter guard', async () => {
    const user = userEvent.setup();
    vi.spyOn(historyConstants, 'isHistoryModeFilter').mockReturnValue(false);
    const { onModeChange } = renderToolbar();

    await user.click(screen.getByRole('combobox', { name: HISTORY_MESSAGES.modeFilter }));
    await user.click(screen.getByRole('option', { name: HISTORY_MODE_LABELS[SELECTION_MODE.ask] }));

    expect(onModeChange).not.toHaveBeenCalled();
  });

  it('ignores a sort value that fails the history-sort guard', async () => {
    const user = userEvent.setup();
    vi.spyOn(historyConstants, 'isHistorySort').mockReturnValue(false);
    const { onSortChange } = renderToolbar();

    await user.click(screen.getByRole('combobox', { name: HISTORY_MESSAGES.sort }));
    await user.click(screen.getByRole('option', { name: HISTORY_SORT_LABELS[HISTORY_SORT.oldest] }));

    expect(onSortChange).not.toHaveBeenCalled();
  });
});
