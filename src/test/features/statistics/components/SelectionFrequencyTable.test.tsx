import { SelectionFrequencyTable } from '@/features/statistics/components/SelectionFrequencyTable';
import { STATISTICS_MESSAGES } from '@/features/statistics/constants';
import { formatPercent } from '@/features/statistics/utils/formatPercent';
import { renderWithProviders, screen, within } from '@/test/test-utils';

describe('SelectionFrequencyTable', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('shows the empty description when there are no rows', () => {
    renderWithProviders(<SelectionFrequencyTable rows={[]} />);

    expect(screen.getByText(STATISTICS_MESSAGES.emptyDescription)).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: STATISTICS_MESSAGES.frequencyAria })).not.toBeInTheDocument();
  });

  it('renders compact frequency cards below the sm breakpoint', () => {
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });

    renderWithProviders(
      <SelectionFrequencyTable rows={[{ name: 'Pizza', count: 4, percent: 50 }]} />,
    );

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: STATISTICS_MESSAGES.frequencyAria })).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText(`${STATISTICS_MESSAGES.count} 4 · ${STATISTICS_MESSAGES.percentage} ${formatPercent(50)}`)).toBeInTheDocument();
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
