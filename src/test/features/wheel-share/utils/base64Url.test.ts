import { decodeBase64UrlToJson, encodeJsonToBase64Url } from '@/features/wheel-share/utils/base64Url';

describe('base64Url codec', () => {
  it('round-trips unicode json without padding or plus-slash characters', () => {
    const token = encodeJsonToBase64Url({ name: '🍕 Food', nested: true });

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeBase64UrlToJson(token)).toEqual({
      ok: true,
      value: { name: '🍕 Food', nested: true },
    });
  });

  it('rejects malformed tokens', () => {
    expect(decodeBase64UrlToJson('')).toEqual({ ok: false });
    expect(decodeBase64UrlToJson('%%%')).toEqual({ ok: false });
    expect(decodeBase64UrlToJson('not-json')).toEqual({ ok: false });
  });
});
