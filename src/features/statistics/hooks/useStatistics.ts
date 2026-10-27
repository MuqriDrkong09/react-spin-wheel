import { useMemo } from 'react';

import { selectHistoryResults } from '@/features/history/utils/selectHistory';
import { selectStatistics } from '@/features/statistics/utils/selectStatistics';
import { useHistoryStore } from '@/stores/historyStore';

export function useStatistics() {
  const spinHistory = useHistoryStore((state) => state.spinHistory);
  const snapshot = useMemo(
    () => selectStatistics(selectHistoryResults(spinHistory)),
    [spinHistory],
  );

  return {
    hasData: snapshot.totalCompletedSelections > 0,
    snapshot,
  };
}
