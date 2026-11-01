import type { WheelExportItem } from '@/features/wheel-export/types';
import type { WHEEL_SHARE_FORMAT, WHEEL_SHARE_VERSION } from '@/features/wheel-share/constants';
import type { Wheel, WheelSettings } from '@/types/wheel';

export interface WheelShareWheel {
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  items: WheelExportItem[];
  settings: WheelSettings;
}

export interface WheelShareDocument {
  format: typeof WHEEL_SHARE_FORMAT;
  version: typeof WHEEL_SHARE_VERSION;
  createdAt: string;
  expiresAt: string;
  wheel: WheelShareWheel;
}

export type ShareReference =
  | { kind: 'encoded'; token: string }
  | { kind: 'remote'; id: string };

export type ShareFailureReason = 'missing' | 'invalid' | 'expired' | 'unavailable';

export type ShareCreateResult =
  | { ok: true; token: string; path: string; url: string; expiresAt: string; document: WheelShareDocument }
  | { ok: false; error: string };

export type ShareResolveResult =
  | { ok: true; document: WheelShareDocument }
  | { ok: false; error: string; reason: ShareFailureReason };

export type WheelShareStatus = {
  severity: 'success' | 'error';
  message: string;
};

export interface WheelShareService {
  createShare(wheel: Wheel, options?: { now?: Date; origin?: string }): ShareCreateResult;
  resolveShare(reference: ShareReference, options?: { now?: Date }): ShareResolveResult;
  parseLocation(input: { search?: string; shareId?: string }): ShareReference | null;
  buildSharePath(token: string): string;
  buildShareUrl(token: string, origin: string): string;
}
