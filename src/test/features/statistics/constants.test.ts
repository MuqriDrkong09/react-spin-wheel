import {
  STATISTICS_CHART_HEIGHT,
  STATISTICS_DATE_RANGE,
  STATISTICS_DATE_RANGE_OPTIONS,
  STATISTICS_MAX_DAILY_SPAN,
  STATISTICS_MAX_MONTHLY_SPAN,
  STATISTICS_MAX_WEEKLY_SPAN,
  STATISTICS_MESSAGES,
  STATISTICS_OTHER_LABEL,
  STATISTICS_TOP_CHART_ITEMS,
} from '@/features/statistics/constants';

describe('STATISTICS_MESSAGES', () => {
  it('keeps the static copy used by the statistics screen', () => {
    expect(STATISTICS_MESSAGES.title).toBe('Statistics');
    expect(STATISTICS_MESSAGES.description).toContain('spin and wheel trends');
    expect(STATISTICS_MESSAGES.emptyTitle).toBe('No statistics yet');
    expect(STATISTICS_MESSAGES.emptyDescription).toContain('Finish a selection');
    expect(STATISTICS_MESSAGES.emptyRangeTitle).toBe('No spins in this range');
    expect(STATISTICS_MESSAGES.emptyRangeDescription).toContain('wider date range');
    expect(STATISTICS_MESSAGES.totalSpins).toBe('Total spins');
    expect(STATISTICS_MESSAGES.totalCompletedSelections).toBe('Total completed selections');
    expect(STATISTICS_MESSAGES.uniqueWinners).toBe('Unique winners');
    expect(STATISTICS_MESSAGES.mostSelectedItem).toBe('Most selected item');
    expect(STATISTICS_MESSAGES.leastSelectedItem).toBe('Least selected item');
    expect(STATISTICS_MESSAGES.mostSelectedParent).toBe('Most selected parent');
    expect(STATISTICS_MESSAGES.mostSelectedChild).toBe('Most selected child');
    expect(STATISTICS_MESSAGES.mostSelectedPath).toBe('Most selected path');
    expect(STATISTICS_MESSAGES.none).toBe('None yet');
    expect(STATISTICS_MESSAGES.selectionFrequency).toBe('Selection frequency');
    expect(STATISTICS_MESSAGES.parentFrequency).toBe('Parent selection frequency');
    expect(STATISTICS_MESSAGES.childFrequency).toBe('Child selection frequency');
    expect(STATISTICS_MESSAGES.pathFrequency).toBe('Full path frequency');
    expect(STATISTICS_MESSAGES.item).toBe('Item');
    expect(STATISTICS_MESSAGES.path).toBe('Path');
    expect(STATISTICS_MESSAGES.count).toBe('Count');
    expect(STATISTICS_MESSAGES.percentage).toBe('Percentage');
    expect(STATISTICS_MESSAGES.spinsPerWheel).toBe('Spins per wheel');
    expect(STATISTICS_MESSAGES.spinFrequency).toBe('Daily activity');
    expect(STATISTICS_MESSAGES.weeklyActivity).toBe('Weekly activity');
    expect(STATISTICS_MESSAGES.monthlyActivity).toBe('Monthly activity');
    expect(STATISTICS_MESSAGES.winnerDistribution).toBe('Winner distribution');
    expect(STATISTICS_MESSAGES.parentVsChild).toBe('Parent vs child selections');
    expect(STATISTICS_MESSAGES.parent).toBe('Parent');
    expect(STATISTICS_MESSAGES.child).toBe('Child');
    expect(STATISTICS_MESSAGES.spins).toBe('Spins');
    expect(STATISTICS_MESSAGES.selections).toBe('Selections');
    expect(STATISTICS_MESSAGES.frequencyAria).toBe('Selection frequency');
    expect(STATISTICS_MESSAGES.parentFrequencyAria).toBe('Parent selection frequency');
    expect(STATISTICS_MESSAGES.childFrequencyAria).toBe('Child selection frequency');
    expect(STATISTICS_MESSAGES.pathFrequencyAria).toBe('Full path frequency');
    expect(STATISTICS_MESSAGES.noChildSelections).toBe('No child selections yet.');
    expect(STATISTICS_MESSAGES.dateRange).toBe('Date range');
    expect(STATISTICS_MESSAGES.rangeToday).toBe('Today');
    expect(STATISTICS_MESSAGES.range7Days).toBe('7 days');
    expect(STATISTICS_MESSAGES.range30Days).toBe('30 days');
    expect(STATISTICS_MESSAGES.rangeAll).toBe('All time');
  });
});

describe('STATISTICS_DATE_RANGE', () => {
  it('exposes the supported range keys', () => {
    expect(STATISTICS_DATE_RANGE).toEqual({
      today: 'today',
      days7: '7d',
      days30: '30d',
      all: 'all',
    });
  });

  it('labels every date-range option from the shared messages', () => {
    expect(STATISTICS_DATE_RANGE_OPTIONS).toEqual([
      { value: STATISTICS_DATE_RANGE.today, label: STATISTICS_MESSAGES.rangeToday },
      { value: STATISTICS_DATE_RANGE.days7, label: STATISTICS_MESSAGES.range7Days },
      { value: STATISTICS_DATE_RANGE.days30, label: STATISTICS_MESSAGES.range30Days },
      { value: STATISTICS_DATE_RANGE.all, label: STATISTICS_MESSAGES.rangeAll },
    ]);

    for (const option of STATISTICS_DATE_RANGE_OPTIONS) {
      expect(Object.values(STATISTICS_DATE_RANGE)).toContain(option.value);
      expect(option.label).toBeTruthy();
    }
  });
});

describe('statistics chart constants', () => {
  it('keeps chart sizing and bucket limits used by the selectors', () => {
    expect(STATISTICS_CHART_HEIGHT).toBe(280);
    expect(STATISTICS_TOP_CHART_ITEMS).toBe(8);
    expect(STATISTICS_MAX_DAILY_SPAN).toBe(90);
    expect(STATISTICS_MAX_WEEKLY_SPAN).toBe(52);
    expect(STATISTICS_MAX_MONTHLY_SPAN).toBe(36);
    expect(STATISTICS_OTHER_LABEL).toBe('Other');
  });
});
