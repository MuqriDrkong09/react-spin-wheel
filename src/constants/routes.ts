import type { WheelId } from '@/types/wheel';

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
