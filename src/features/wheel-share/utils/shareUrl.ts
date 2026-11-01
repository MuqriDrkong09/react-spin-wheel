import { ROUTES } from '@/constants/routes';
import { SHARE_QUERY_PARAM } from '@/features/wheel-share/constants';

export function buildEncodedSharePath(token: string): string {
  return `${ROUTES.sharedWheel}?${SHARE_QUERY_PARAM}=${encodeURIComponent(token)}`;
}

export function buildRemoteSharePath(id: string): string {
  return `${ROUTES.sharedWheel}/${encodeURIComponent(id)}`;
}

export function buildShareUrl(path: string, origin: string): string {
  return `${origin.replace(/\/$/, '')}${path}`;
}

export function parseShareLocation(input: { search?: string; shareId?: string }): {
  kind: 'encoded';
  token: string;
} | {
  kind: 'remote';
  id: string;
} | null {
  const shareId = input.shareId?.trim();
  if (shareId) {
    return { kind: 'remote', id: shareId };
  }

  const search = input.search?.startsWith('?') ? input.search.slice(1) : (input.search ?? '');
  const token = new URLSearchParams(search).get(SHARE_QUERY_PARAM)?.trim();
  if (token) {
    return { kind: 'encoded', token };
  }

  return null;
}
