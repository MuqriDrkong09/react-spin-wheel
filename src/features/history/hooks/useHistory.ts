import { useMemo, useState } from 'react';

import {
  HISTORY_FILTER_ALL,
  HISTORY_PAGE_SIZE,
  HISTORY_SORT,
  type HistorySort,
} from '@/features/history/constants';
import {
  paginateHistory,
  selectFilteredHistory,
  selectHistoryResults,
  selectHistoryWheels,
  type HistoryResult,
} from '@/features/history/utils/selectHistory';
import { useHistoryStore } from '@/stores/historyStore';

export function useHistory() {
  const spinHistory = useHistoryStore((state) => state.spinHistory);
  const deleteSpinSession = useHistoryStore((state) => state.deleteSpinSession);
  const clearSpinHistory = useHistoryStore((state) => state.clearSpinHistory);

  const [search, setSearch] = useState('');
  const [wheelId, setWheelId] = useState(HISTORY_FILTER_ALL);
  const [mode, setMode] = useState(HISTORY_FILTER_ALL);
  const [sort, setSort] = useState<HistorySort>(HISTORY_SORT.newest);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(HISTORY_PAGE_SIZE);
  const [selected, setSelected] = useState<HistoryResult | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HistoryResult | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const results = useMemo(() => selectHistoryResults(spinHistory), [spinHistory]);
  const wheels = useMemo(() => selectHistoryWheels(results), [results]);
  const filtered = useMemo(
    () => selectFilteredHistory(results, search, wheelId, mode, sort),
    [results, search, wheelId, mode, sort],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => paginateHistory(filtered, safePage, pageSize),
    [filtered, safePage, pageSize],
  );

  return {
    hasHistory: results.length > 0,
    wheels,
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(0);
    },
    wheelId,
    setWheelId: (value: string) => {
      setWheelId(value);
      setPage(0);
    },
    mode,
    setMode: (value: string) => {
      setMode(value);
      setPage(0);
    },
    sort,
    setSort: (value: HistorySort) => {
      setSort(value);
      setPage(0);
    },
    filteredCount: filtered.length,
    visible,
    page: safePage,
    pageSize,
    setPage,
    setPageSize: (value: number) => {
      setPageSize(value);
      setPage(0);
    },
    selected,
    openDetails: setSelected,
    closeDetails: () => setSelected(null),
    pendingDelete,
    requestDelete: setPendingDelete,
    cancelDelete: () => setPendingDelete(null),
    confirmDelete: () => {
      if (pendingDelete) {
        deleteSpinSession(pendingDelete.id);
      }
      setPendingDelete(null);
      setSelected((current) => (current?.id === pendingDelete?.id ? null : current));
    },
    clearOpen,
    requestClear: () => setClearOpen(true),
    cancelClear: () => setClearOpen(false),
    confirmClear: () => {
      clearSpinHistory();
      setClearOpen(false);
      setSelected(null);
      setPage(0);
    },
  };
}
