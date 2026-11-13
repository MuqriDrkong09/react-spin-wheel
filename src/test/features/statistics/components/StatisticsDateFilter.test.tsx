import { StatisticsDateFilter } from '@/features/statistics/components/StatisticsDateFilter';
import {
  STATISTICS_DATE_RANGE,
  STATISTICS_DATE_RANGE_OPTIONS,
  STATISTICS_MESSAGES,
} from '@/features/statistics/constants';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

describe('StatisticsDateFilter', () => {
  it('renders every date-range option and marks the current value pressed', () => {
    renderWithProviders(
      <StatisticsDateFilter value={STATISTICS_DATE_RANGE.days7} onChange={vi.fn()} />,
    );

    expect(screen.getByRole('group', { name: STATISTICS_MESSAGES.dateRange })).toBeInTheDocument();

    for (const option of STATISTICS_DATE_RANGE_OPTIONS) {
      const button = screen.getByRole('button', { name: option.label });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute(
        'aria-pressed',
        option.value === STATISTICS_DATE_RANGE.days7 ? 'true' : 'false',
      );
    }
  });

  it('notifies when a different range is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <StatisticsDateFilter value={STATISTICS_DATE_RANGE.all} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: STATISTICS_MESSAGES.rangeToday }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(STATISTICS_DATE_RANGE.today);
  });

  it('ignores a deselection that clears the exclusive value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <StatisticsDateFilter value={STATISTICS_DATE_RANGE.days30} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: STATISTICS_MESSAGES.range30Days }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
