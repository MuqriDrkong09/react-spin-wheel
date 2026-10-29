import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { ROUTES, withWheelId } from '@/constants/routes';
import { CATEGORY_FILTER_ALL, WHEEL_SORT } from '@/features/dashboard/constants';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { resetFavoritesStore, useFavoritesStore } from '@/stores/favoritesStore';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { resetSettingsStore, useSettingsStore } from '@/stores/settingsStore';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { SPIN_SESSION_STATUS } from '@/types/wheel';

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={[ROUTES.dashboard]}>{children}</MemoryRouter>;
}

function useDashboardWithLocation() {
  const dashboard = useDashboard();
  const location = useLocation();

  return {
    ...dashboard,
    href: `${location.pathname}${location.search}`,
  };
}

function seedDashboard() {
  useWheelStore.getState().createWheel({
    id: 'pizza',
    name: 'Pizza Night',
    description: 'Weekend dinner',
    category: 'Food',
  });
  useWheelStore.getState().createWheel({
    id: 'chores',
    name: 'Chores',
    category: 'Decisions',
  });
  useFavoritesStore.getState().addFavorite('pizza');
  useHistoryStore.getState().addSpinSession({
    id: 's1',
    wheelId: 'pizza',
    wheelName: 'Pizza Night',
    status: SPIN_SESSION_STATUS.completed,
    results: [
      {
        id: 'r1',
        sessionId: 's1',
        wheelId: 'pizza',
        itemId: 'pepperoni',
        itemName: 'Pepperoni',
        selectedItemId: 'pepperoni',
        selectedItemName: 'Pepperoni',
        parentItemId: null,
        path: ['pepperoni'],
        pathLabels: ['Pepperoni'],
        depth: 0,
        probability: 1,
        timestamp: '2026-01-04T00:00:00.000Z',
        spunAt: '2026-01-04T00:00:00.000Z',
        duration: 1200,
        mode: 'manual',
      },
    ],
    path: ['pepperoni'],
    startedAt: '2026-01-04T00:00:00.000Z',
    completedAt: '2026-01-04T00:00:01.000Z',
  });
}

describe('useDashboard', () => {
  beforeEach(() => {
    resetWheelStore();
    resetHistoryStore();
    resetFavoritesStore();
    resetSettingsStore();
  });

  it('starts empty with default filters', () => {
    const { result } = renderHook(() => useDashboardWithLocation(), { wrapper });

    expect(result.current.hasWheels).toBe(false);
    expect(result.current.visibleWheels).toEqual([]);
    expect(result.current.favoriteWheels).toEqual([]);
    expect(result.current.recentlyUsedWheels).toEqual([]);
    expect(result.current.recentResults).toEqual([]);
    expect(result.current.stats).toEqual({
      totalWheels: 0,
      totalSpins: 0,
      totalWinners: 0,
      favoriteCount: 0,
    });
    expect(result.current.search).toBe('');
    expect(result.current.category).toBe(CATEGORY_FILTER_ALL);
    expect(result.current.sort).toBe(WHEEL_SORT.updatedDesc);
    expect(result.current.pendingDeleteWheel).toBeNull();
  });

  it('derives stats, favorites, recent usage, and results from stores', () => {
    seedDashboard();
    const { result } = renderHook(() => useDashboardWithLocation(), { wrapper });

    expect(result.current.hasWheels).toBe(true);
    expect(result.current.visibleWheels.map((wheel) => wheel.id)).toEqual(
      expect.arrayContaining(['pizza', 'chores']),
    );
    expect(result.current.favoriteWheels.map((wheel) => wheel.id)).toEqual(['pizza']);
    expect(result.current.recentlyUsedWheels.map(({ wheel }) => wheel.id)).toEqual(['pizza']);
    expect(result.current.recentResults.map((item) => item.itemName)).toEqual(['Pepperoni']);
    expect(result.current.stats).toEqual({
      totalWheels: 2,
      totalSpins: 1,
      totalWinners: 1,
      favoriteCount: 1,
    });
    expect(result.current.categoryOptions).toEqual(
      expect.arrayContaining([CATEGORY_FILTER_ALL, 'Food', 'Decisions']),
    );
  });

  it('filters visible wheels by search, category, and sort', () => {
    seedDashboard();
    const { result } = renderHook(() => useDashboardWithLocation(), { wrapper });

    act(() => {
      result.current.setSearch('chore');
    });
    expect(result.current.visibleWheels.map((wheel) => wheel.id)).toEqual(['chores']);

    act(() => {
      result.current.setSearch('');
      result.current.setCategory('Food');
    });
    expect(result.current.visibleWheels.map((wheel) => wheel.id)).toEqual(['pizza']);

    act(() => {
      result.current.setCategory(CATEGORY_FILTER_ALL);
      result.current.setSort(WHEEL_SORT.nameAsc);
    });
    expect(result.current.visibleWheels.map((wheel) => wheel.name)).toEqual(['Chores', 'Pizza Night']);
  });

  it('navigates to create, spin, and editor routes', () => {
    seedDashboard();
    const { result } = renderHook(() => useDashboardWithLocation(), { wrapper });

    act(() => {
      result.current.openCreate();
    });
    expect(result.current.href).toBe(ROUTES.createWheel);

    act(() => {
      result.current.openWheel('pizza');
    });
    expect(useWheelStore.getState().activeWheelId).toBe('pizza');
    expect(result.current.href).toBe(withWheelId(ROUTES.spin, 'pizza'));

    act(() => {
      result.current.editWheel('chores');
    });
    expect(useWheelStore.getState().activeWheelId).toBe('chores');
    expect(result.current.href).toBe(withWheelId(ROUTES.wheelEditor, 'chores'));
  });

  it('ignores delete requests for a missing wheel', () => {
    seedDashboard();
    const { result } = renderHook(() => useDashboardWithLocation(), { wrapper });

    act(() => {
      result.current.requestDelete('missing');
    });

    expect(result.current.pendingDeleteWheel).toBeNull();
    expect(useWheelStore.getState().wheels).toHaveLength(2);
  });

  it('stages, cancels, and confirms a pending delete', () => {
    seedDashboard();
    const { result } = renderHook(() => useDashboardWithLocation(), { wrapper });

    act(() => {
      result.current.requestDelete('pizza');
    });
    expect(result.current.pendingDeleteWheel?.id).toBe('pizza');
    expect(useWheelStore.getState().getWheel('pizza')).toBeDefined();

    act(() => {
      result.current.cancelDelete();
    });
    expect(result.current.pendingDeleteWheel).toBeNull();
    expect(useWheelStore.getState().getWheel('pizza')).toBeDefined();

    act(() => {
      result.current.requestDelete('pizza');
    });
    act(() => {
      result.current.confirmPendingDelete();
    });

    expect(result.current.pendingDeleteWheel).toBeNull();
    expect(useWheelStore.getState().getWheel('pizza')).toBeUndefined();
    expect(useFavoritesStore.getState().favoriteWheelIds).not.toContain('pizza');
  });

  it('does nothing when confirming a delete with no pending wheel', () => {
    seedDashboard();
    const { result } = renderHook(() => useDashboardWithLocation(), { wrapper });

    act(() => {
      result.current.confirmPendingDelete();
    });

    expect(useWheelStore.getState().wheels).toHaveLength(2);
  });

  it('deletes immediately when confirmation is disabled', () => {
    useSettingsStore.getState().updateSettings({ confirmBeforeDelete: false });
    seedDashboard();
    const { result } = renderHook(() => useDashboardWithLocation(), { wrapper });

    act(() => {
      result.current.requestDelete('pizza');
    });

    expect(result.current.pendingDeleteWheel).toBeNull();
    expect(useWheelStore.getState().getWheel('pizza')).toBeUndefined();
    expect(useFavoritesStore.getState().favoriteWheelIds).not.toContain('pizza');
  });

  it('toggles a favorite from the returned action', () => {
    seedDashboard();
    const { result } = renderHook(() => useDashboardWithLocation(), { wrapper });

    act(() => {
      result.current.toggleFavorite('pizza');
    });
    expect(result.current.favoriteWheelIds).not.toContain('pizza');

    act(() => {
      result.current.toggleFavorite('pizza');
    });
    expect(result.current.favoriteWheelIds).toContain('pizza');
  });
});
