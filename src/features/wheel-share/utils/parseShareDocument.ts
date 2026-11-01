import { SHARE_MESSAGES } from '@/features/wheel-share/constants';
import { parseShareWheel, wheelShareEnvelopeSchema } from '@/features/wheel-share/schema';
import type { ShareResolveResult } from '@/features/wheel-share/types';

export function parseShareDocument(value: unknown, now: Date): ShareResolveResult {
  const envelope = wheelShareEnvelopeSchema.safeParse(value);
  if (!envelope.success) {
    return { ok: false, error: SHARE_MESSAGES.invalid, reason: 'invalid' };
  }

  const createdAt = Date.parse(envelope.data.createdAt);
  const expiresAt = Date.parse(envelope.data.expiresAt);
  if (Number.isNaN(createdAt) || Number.isNaN(expiresAt) || expiresAt < createdAt) {
    return { ok: false, error: SHARE_MESSAGES.invalid, reason: 'invalid' };
  }

  if (expiresAt <= now.getTime()) {
    return { ok: false, error: SHARE_MESSAGES.expired, reason: 'expired' };
  }

  const wheel = parseShareWheel(envelope.data.wheel);
  if (!wheel.ok) {
    return { ok: false, error: SHARE_MESSAGES.invalid, reason: 'invalid' };
  }

  return {
    ok: true,
    document: {
      format: envelope.data.format,
      version: envelope.data.version,
      createdAt: envelope.data.createdAt,
      expiresAt: envelope.data.expiresAt,
      wheel: wheel.wheel,
    },
  };
}
