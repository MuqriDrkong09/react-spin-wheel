import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES, withWheelId } from '@/constants/routes';
import { CATEGORY_FILTER_ALL, WHEEL_SORT, type WheelSort } from '@/features/dashboard/constants';
import {
  getCategoryOptions,
  selectDashboardStats,
  selectFavoriteWheels,
  selectFilteredWheels,
  selectRecentResults,
  selectRecentlyUsedWheels,
} from '@/features/dashboard/utils/selectDashboardData';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWheelStore } from '@/stores/wheelStore';
import type { Wheel, WheelId } from '@/types/wheel';

export function useDashboard() {
  const navigate = useNavigate();
  const wheels = useWheelStore((state) => state.wheels);
  const deleteWheel = useWheelStore((state) => state.deleteWheel);
  const setActiveWheel = useWheelStore((state) => state.setActiveWheel);
  const spinHistory = useHistoryStore((state) => state.spinHistory);
  const favoriteWheelIds = useFavoritesStore((state) => state.favoriteWheelIds);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const confirmBeforeDelete = useSettingsStore((state) => state.settings.confirmBeforeDelete);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(CATEGORY_FILTER_ALL);
  const [sort, setSort] = useState<WheelSort>(WHEEL_SORT.updatedDesc);
  const [wheelPendingDelete, setWheelPendingDelete] = useState<Wheel | null>(null);

  const stats = useMemo(
    () => selectDashboardStats(wheels, spinHistory, favoriteWheelIds),
    [wheels, spinHistory, favoriteWheelIds],
  );

  const categoryOptions = useMemo(() => getCategoryOptions(wheels), [wheels]);

  const visibleWheels = useMemo(
    () => selectFilteredWheels(wheels, spinHistory, search, category, sort),
    [wheels, spinHistory, search, category, sort],
  );

  const favoriteWheels = useMemo(
    () => selectFavoriteWheels(wheels, favoriteWheelIds),
    [wheels, favoriteWheelIds],
  );

  const recentlyUsedWheels = useMemo(
    () => selectRecentlyUsedWheels(wheels, spinHistory),
    [wheels, spinHistory],
  );

  const recentResults = useMemo(() => selectRecentResults(spinHistory), [spinHistory]);

  const openCreate = () => {
    void navigate(ROUTES.createWheel);
  };

  const openWheel = (wheelId: WheelId) => {
    setActiveWheel(wheelId);
    void navigate(withWheelId(ROUTES.spin, wheelId));
  };

  const editWheel = (wheelId: WheelId) => {
    setActiveWheel(wheelId);
    void navigate(withWheelId(ROUTES.wheelEditor, wheelId));
  };

  const confirmDelete = (wheelId: WheelId) => {
    deleteWheel(wheelId);
    removeFavorite(wheelId);
    setWheelPendingDelete(null);
  };

  const requestDelete = (wheelId: WheelId) => {
    const wheel = wheels.find((item) => item.id === wheelId);
    if (!wheel) {
      return;
    }

    if (confirmBeforeDelete) {
      setWheelPendingDelete(wheel);
      return;
    }

    confirmDelete(wheel.id);
  };

  const confirmPendingDelete = () => {
    if (wheelPendingDelete) {
      confirmDelete(wheelPendingDelete.id);
    }
  };

  return {
    visibleWheels,
    favoriteWheels,
    recentlyUsedWheels,
    recentResults,
    stats,
    search,
    setSearch,
    category,
    setCategory,
    categoryOptions,
    sort,
    setSort,
    openCreate,
    openWheel,
    editWheel,
    requestDelete,
    confirmPendingDelete,
    cancelDelete: () => setWheelPendingDelete(null),
    pendingDeleteWheel: wheelPendingDelete,
    favoriteWheelIds,
    toggleFavorite,
    hasWheels: wheels.length > 0,
  };
}
