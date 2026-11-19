import type { TestDatasetId } from '@/features/test-data-generator/types';
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
  testDataGenerator: '/test-data',
  sharedWheel: '/share',
} as const;

export function withWheelId(path: string, wheelId: WheelId): string {
  return `${path}?wheelId=${encodeURIComponent(wheelId)}`;
}

export function withTestDatasetId(path: string, datasetId: TestDatasetId): string {
  return `${path}?datasetId=${encodeURIComponent(datasetId)}`;
}

/** Open spin for a wheel, optionally starting under a specific item's children. */
export function withSpinFromItem(wheelId: WheelId, fromItemId: WheelItemId): string {
  const params = new URLSearchParams({
    wheelId,
    fromItemId,
  });
  return `${ROUTES.spin}?${params.toString()}`;
}
