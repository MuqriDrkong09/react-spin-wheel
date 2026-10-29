import { SelectionFrequencyTable } from '@/features/statistics/components/SelectionFrequencyTable';
import { STATISTICS_MESSAGES } from '@/features/statistics/constants';
import { formatPercent } from '@/features/statistics/utils/formatPercent';
import { renderWithProviders, screen, within } from '@/test/test-utils';

describe('SelectionFrequencyTable', () => {
  it('shows the empty description when there are no rows', () => {
    renderWithProviders(<SelectionFrequencyTable rows={[]} />);

    expect(screen.getByText(STATISTICS_MESSAGES.emptyDescription)).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: STATISTICS_MESSAGES.frequencyAria })).not.toBeInTheDocument();
  });

  it('renders item counts and formatted percentages', () => {
    renderWithProviders(
      <SelectionFrequencyTable
        rows={[
          { name: 'Pizza', count: 4, percent: 50 },
          { name: 'Burger', count: 3, percent: 33.333 },
        ]}
      />,
    );

    const table = screen.getByRole('table', { name: STATISTICS_MESSAGES.frequencyAria });
    expect(within(table).getByRole('columnheader', { name: STATISTICS_MESSAGES.item })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: STATISTICS_MESSAGES.count })).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: STATISTICS_MESSAGES.percentage }),
    ).toBeInTheDocument();

    const [pizza, burger] = within(table).getAllByRole('row').slice(1);
    expect(within(pizza!).getByText('Pizza')).toBeInTheDocument();
    expect(within(pizza!).getByText('4')).toBeInTheDocument();
    expect(within(pizza!).getByText(formatPercent(50))).toBeInTheDocument();
    expect(within(burger!).getByText('Burger')).toBeInTheDocument();
    expect(within(burger!).getByText('3')).toBeInTheDocument();
    expect(within(burger!).getByText(formatPercent(33.333))).toBeInTheDocument();
  });
});
