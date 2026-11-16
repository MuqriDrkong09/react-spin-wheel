import type { WheelId, WheelItemId } from '@/types/wheel';

export const ROUTES = {
  dashboard: '/',
  wheels: '/wheels',
  createWheel: '/create-wheel',
  wheelEditor: '/editor',
  spin: '/spin',
  history: '/history',
  statistics: '/statistics',
  presets: '/presets',
  settings: '/settings',
  randomGenerator: '/random-generator',
  sharedWheel: '/share',
} as const;

export function withWheelId(path: string, wheelId: WheelId): string {
  return `${path}?wheelId=${encodeURIComponent(wheelId)}`;
}

/** Open spin for a wheel, optionally starting under a specific item's children. */
export function withSpinFromItem(wheelId: WheelId, fromItemId: WheelItemId): string {
  const params = new URLSearchParams({
    wheelId,
    fromItemId,
  });
  return `${ROUTES.spin}?${params.toString()}`;
}
