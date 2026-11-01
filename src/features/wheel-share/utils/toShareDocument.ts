import { SHARE_TTL_MS, WHEEL_SHARE_FORMAT, WHEEL_SHARE_VERSION } from '@/features/wheel-share/constants';
import type { WheelShareDocument } from '@/features/wheel-share/types';
import { toWheelExportDocument } from '@/features/wheel-export/utils/toWheelExport';
import type { Wheel } from '@/types/wheel';

export function toShareDocument(
  wheel: Wheel,
  now: Date,
  ttlMs = SHARE_TTL_MS,
): WheelShareDocument {
  const exported = toWheelExportDocument(wheel);
  const { format: _format, version: _version, ...shareWheel } = exported;

  return {
    format: WHEEL_SHARE_FORMAT,
    version: WHEEL_SHARE_VERSION,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    wheel: shareWheel,
  };
}
