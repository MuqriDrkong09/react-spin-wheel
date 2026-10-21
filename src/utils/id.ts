import type { IsoDateTime } from '@/types/wheel';

export function createId(): string {
  return crypto.randomUUID();
}

export function nowIso(): IsoDateTime {
  return new Date().toISOString();
}
