import { useMemo, useState } from 'react';

import { selectHistoryResults } from '@/features/history/utils/selectHistory';
import {
  STATISTICS_DATE_RANGE,
  type StatisticsDateRange,
} from '@/features/statistics/constants';
import { selectStatistics } from '@/features/statistics/utils/selectStatistics';
import { useHistoryStore } from '@/stores/historyStore';

export function useStatistics() {
  const spinHistory = useHistoryStore((state) => state.spinHistory);
  const [range, setRange] = useState<StatisticsDateRange>(STATISTICS_DATE_RANGE.all);

  const historyResults = useMemo(() => selectHistoryResults(spinHistory), [spinHistory]);

  const snapshot = useMemo(
    () => selectStatistics(historyResults, { range }),
    [historyResults, range],
  );

  return {
    range,
    setRange,
    hasHistory: historyResults.length > 0,
    hasData: snapshot.totalCompletedSelections > 0,
    snapshot,
  };
}
