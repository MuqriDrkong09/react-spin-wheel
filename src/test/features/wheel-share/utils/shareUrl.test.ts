import { ROUTES } from '@/constants/routes';
import { SHARE_QUERY_PARAM } from '@/features/wheel-share/constants';
import {
  buildEncodedSharePath,
  buildRemoteSharePath,
  buildShareUrl,
  parseShareLocation,
} from '@/features/wheel-share/utils/shareUrl';

describe('share urls', () => {
  it('builds encoded query paths that a backend path can replace later', () => {
    expect(buildEncodedSharePath('abc_def')).toBe(`${ROUTES.sharedWheel}?${SHARE_QUERY_PARAM}=abc_def`);
    expect(buildRemoteSharePath('share-1')).toBe(`${ROUTES.sharedWheel}/share-1`);
    expect(buildShareUrl('/share?s=abc', 'http://localhost:5173/')).toBe('http://localhost:5173/share?s=abc');
  });

  it('parses encoded query tokens and remote path ids', () => {
    expect(parseShareLocation({ search: `?${SHARE_QUERY_PARAM}=token-1` })).toEqual({
      kind: 'encoded',
      token: 'token-1',
    });
    expect(parseShareLocation({ search: `${SHARE_QUERY_PARAM}=token-1` })).toEqual({
      kind: 'encoded',
      token: 'token-1',
    });
    expect(parseShareLocation({ search: `?${SHARE_QUERY_PARAM}=query`, shareId: 'remote-1' })).toEqual({
      kind: 'remote',
      id: 'remote-1',
    });
    expect(parseShareLocation({ search: '' })).toBeNull();
  });
});
