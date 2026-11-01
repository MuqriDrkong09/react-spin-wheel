import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { wheelExportDocumentSchema } from '@/features/wheel-export/schema';
import {
  MAX_SHARE_TOKEN_LENGTH,
  SHARE_MESSAGES,
  SHARE_TTL_MS,
} from '@/features/wheel-share/constants';
import type { ShareCreateResult, ShareResolveResult, WheelShareService } from '@/features/wheel-share/types';
import { decodeBase64UrlToJson, encodeJsonToBase64Url } from '@/features/wheel-share/utils/base64Url';
import { parseShareDocument } from '@/features/wheel-share/utils/parseShareDocument';
import { shareValidationMessage } from '@/features/wheel-share/utils/shareValidationMessage';
import {
  buildEncodedSharePath,
  buildShareUrl,
  parseShareLocation,
} from '@/features/wheel-share/utils/shareUrl';
import { toShareDocument } from '@/features/wheel-share/utils/toShareDocument';
import type { Wheel } from '@/types/wheel';

interface EncodedShareServiceOptions {
  now?: () => Date;
  origin?: () => string;
  ttlMs?: number;
  maxTokenLength?: number;
}

export function createEncodedShareService(
  options: EncodedShareServiceOptions = {},
): WheelShareService {
  const now = options.now ?? (() => new Date());
  const origin = options.origin ?? (() => window.location.origin);
  const ttlMs = options.ttlMs ?? SHARE_TTL_MS;
  const maxTokenLength = options.maxTokenLength ?? MAX_SHARE_TOKEN_LENGTH;

  return {
    createShare(wheel: Wheel, createOptions = {}): ShareCreateResult {
      const createdAt = createOptions.now ?? now();
      const document = toShareDocument(wheel, createdAt, ttlMs);
      const validated = wheelExportDocumentSchema.safeParse({
        format: WHEEL_EXPORT_FORMAT,
        version: WHEEL_EXPORT_VERSION,
        ...document.wheel,
      });

      if (!validated.success) {
        return { ok: false, error: shareValidationMessage(validated.error.issues) };
      }

      const token = encodeJsonToBase64Url({
        ...document,
        wheel: {
          name: validated.data.name,
          description: validated.data.description,
          category: validated.data.category,
          icon: validated.data.icon,
          items: validated.data.items,
          settings: validated.data.settings,
        },
      });

      if (token.length > maxTokenLength) {
        return { ok: false, error: SHARE_MESSAGES.tooLarge };
      }

      const path = buildEncodedSharePath(token);
      const shareOrigin = createOptions.origin ?? origin();

      return {
        ok: true,
        token,
        path,
        url: buildShareUrl(path, shareOrigin),
        expiresAt: document.expiresAt,
        document: {
          ...document,
          wheel: {
            name: validated.data.name,
            description: validated.data.description,
            category: validated.data.category,
            icon: validated.data.icon,
            items: validated.data.items,
            settings: validated.data.settings,
          },
        },
      };
    },

    resolveShare(reference, resolveOptions = {}): ShareResolveResult {
      if (reference.kind === 'remote') {
        return { ok: false, error: SHARE_MESSAGES.unavailable, reason: 'unavailable' };
      }

      if (reference.token.length > maxTokenLength) {
        return { ok: false, error: SHARE_MESSAGES.invalid, reason: 'invalid' };
      }

      const decoded = decodeBase64UrlToJson(reference.token);
      if (!decoded.ok) {
        return { ok: false, error: SHARE_MESSAGES.invalid, reason: 'invalid' };
      }

      return parseShareDocument(decoded.value, resolveOptions.now ?? now());
    },

    parseLocation: parseShareLocation,
    buildSharePath: buildEncodedSharePath,
    buildShareUrl: (token, shareOrigin) => buildShareUrl(buildEncodedSharePath(token), shareOrigin),
  };
}
