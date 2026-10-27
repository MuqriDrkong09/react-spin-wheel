import type { IsoDateTime } from '@/types/wheel';

export function createId(): string {
  return crypto.randomUUID();
}

export function nowIso(): IsoDateTime {
  return new Date().toISOString();
}

export function nowMs(): number {
  return performance.now();
}

export function elapsedMs(startedAt: number): number {
  return Math.max(0, Math.round(nowMs() - startedAt));
}
