import {
  CATEGORY_FILTER_ALL,
  DEFAULT_WHEEL_CATEGORY,
  DASHBOARD_LIST_LIMIT,
  WHEEL_CATEGORIES,
  WHEEL_SORT,
  type WheelSort,
} from '@/features/dashboard/constants';
import { SPIN_SESSION_STATUS, type SpinSession, type Wheel, type WheelId } from '@/types/wheel';

export interface DashboardStats {
  totalWheels: number;
  totalSpins: number;
  totalWinners: number;
  favoriteCount: number;
}

export interface RecentResult {
  id: string;
  wheelId: WheelId;
  wheelName: string;
  itemName: string;
  spunAt: string;
}

export interface RecentWheelUsage {
  wheel: Wheel;
  lastUsedAt: string;
}

export function getWheelCategory(wheel: Wheel): string {
  return wheel.category?.trim() || DEFAULT_WHEEL_CATEGORY;
}

export function getCategoryOptions(wheels: Wheel[]): string[] {
  const fromWheels = wheels.map(getWheelCategory);
  return Array.from(new Set([CATEGORY_FILTER_ALL, ...WHEEL_CATEGORIES, ...fromWheels]));
}

export function getLastUsedAt(
  wheelId: WheelId,
  spinHistory: SpinSession[],
): string | undefined {
  const session = spinHistory.find((entry) => entry.wheelId === wheelId);
  return session?.startedAt;
}

export function selectDashboardStats(
  wheels: Wheel[],
  spinHistory: SpinSession[],
  favoriteWheelIds: WheelId[],
): DashboardStats {
  const existingIds = new Set(wheels.map((wheel) => wheel.id));
  const completedSessions = spinHistory.filter(
    (session) => session.status === SPIN_SESSION_STATUS.completed,
  );

  return {
    totalWheels: wheels.length,
    totalSpins: spinHistory.length,
    totalWinners: completedSessions.filter((session) => session.results.length > 0).length,
    favoriteCount: favoriteWheelIds.filter((id) => existingIds.has(id)).length,
  };
}

export interface WheelListQuery {
  search: string;
  category: string;
  sort: WheelSort;
  favoriteWheelIds?: readonly WheelId[];
  favoritesOnly?: boolean;
  recentlyUsedOnly?: boolean;
}

export function matchesWheelSearch(wheel: Wheel, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (query.length === 0) {
    return true;
  }

  return (
    wheel.name.toLowerCase().includes(query) ||
    (wheel.description ?? '').toLowerCase().includes(query) ||
    getWheelCategory(wheel).toLowerCase().includes(query)
  );
}

export function selectFilteredWheels(
  wheels: Wheel[],
  spinHistory: SpinSession[],
  query: WheelListQuery,
): Wheel[] {
  const favoriteIds = new Set(query.favoriteWheelIds ?? []);
  const usedIds = new Set(spinHistory.map((session) => session.wheelId));
  const useCounts = countWheelUses(spinHistory);

  const filtered = wheels.filter((wheel) => {
    const matchesCategory =
      query.category === CATEGORY_FILTER_ALL || getWheelCategory(wheel) === query.category;
    const matchesFavorite = !query.favoritesOnly || favoriteIds.has(wheel.id);
    const matchesRecent = !query.recentlyUsedOnly || usedIds.has(wheel.id);

    return matchesCategory && matchesWheelSearch(wheel, query.search) && matchesFavorite && matchesRecent;
  });

  return [...filtered].sort((left, right) => compareWheels(left, right, query.sort, useCounts));
}

export function selectFavoriteWheels(wheels: Wheel[], favoriteWheelIds: WheelId[]): Wheel[] {
  const wheelsById = new Map(wheels.map((wheel) => [wheel.id, wheel]));

  return favoriteWheelIds
    .map((id) => wheelsById.get(id))
    .filter((wheel): wheel is Wheel => Boolean(wheel))
    .slice(0, DASHBOARD_LIST_LIMIT);
}

export function selectRecentlyUsedWheels(
  wheels: Wheel[],
  spinHistory: SpinSession[],
): RecentWheelUsage[] {
  const wheelsById = new Map(wheels.map((wheel) => [wheel.id, wheel]));
  const seen = new Set<WheelId>();
  const recent: RecentWheelUsage[] = [];

  for (const session of spinHistory) {
    if (seen.has(session.wheelId)) {
      continue;
    }

    const wheel = wheelsById.get(session.wheelId);
    if (!wheel) {
      continue;
    }

    seen.add(session.wheelId);
    recent.push({
      wheel,
      lastUsedAt: session.startedAt,
    });

    if (recent.length >= DASHBOARD_LIST_LIMIT) {
      break;
    }
  }

  return recent;
}

export function selectRecentResults(spinHistory: SpinSession[]): RecentResult[] {
  const results: RecentResult[] = [];

  for (const session of spinHistory) {
    const winner = session.results[session.results.length - 1];
    if (!winner) {
      continue;
    }

    results.push({
      id: winner.id,
      wheelId: session.wheelId,
      wheelName: session.wheelName,
      itemName: winner.itemName,
      spunAt: winner.spunAt,
    });

    if (results.length >= DASHBOARD_LIST_LIMIT) {
      break;
    }
  }

  return results;
}

function countWheelUses(spinHistory: SpinSession[]): Map<WheelId, number> {
  const counts = new Map<WheelId, number>();

  for (const session of spinHistory) {
    counts.set(session.wheelId, (counts.get(session.wheelId) ?? 0) + 1);
  }

  return counts;
}

function compareWheels(
  left: Wheel,
  right: Wheel,
  sort: WheelSort,
  useCounts: Map<WheelId, number>,
): number {
  if (sort === WHEEL_SORT.nameAsc) {
    return left.name.localeCompare(right.name);
  }

  if (sort === WHEEL_SORT.createdDesc) {
    return right.createdAt.localeCompare(left.createdAt);
  }

  if (sort === WHEEL_SORT.usedCountDesc) {
    const leftCount = useCounts.get(left.id) ?? 0;
    const rightCount = useCounts.get(right.id) ?? 0;
    if (leftCount !== rightCount) {
      return rightCount - leftCount;
    }
  }

  return right.updatedAt.localeCompare(left.updatedAt);
}
