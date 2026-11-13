import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { SHARE_MESSAGES, SHARE_QUERY_PARAM } from '@/features/wheel-share/constants';
import { createEncodedShareService } from '@/features/wheel-share/services/encodedShareService';
import { encodeJsonToBase64Url } from '@/features/wheel-share/utils/base64Url';
import type { Wheel, WheelItem } from '@/types/wheel';

function createItem(overrides: Partial<WheelItem> & Pick<WheelItem, 'id' | 'name'>): WheelItem {
  return {
    color: '#4f46e5',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createWheel(overrides: Partial<Wheel> = {}): Wheel {
  return {
    id: 'food-picker',
    name: 'Food Picker',
    items: [createItem({ id: 'pizza', name: 'Pizza', color: '#ea580c' })],
    settings: DEFAULT_WHEEL_SETTINGS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('encodedShareService', () => {
  const now = new Date('2026-11-01T00:00:00.000Z');
  const service = createEncodedShareService({
    now: () => now,
    origin: () => 'http://localhost:5173',
  });

  it('creates a url-safe share and resolves it after validation', () => {
    const created = service.createShare(createWheel());

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    expect(created.url).toBe(`http://localhost:5173${created.path}`);
    expect(created.path).toContain('/share?s=');
    expect(created.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(JSON.stringify(created.document)).not.toContain('food-picker');

    const resolved = service.resolveShare({ kind: 'encoded', token: created.token });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.document.wheel.name).toBe('Food Picker');
      expect(resolved.document.wheel.items[0]?.name).toBe('Pizza');
    }
  });

  it('rejects empty wheels, oversized tokens, expired payloads, and remote ids', () => {
    expect(service.createShare(createWheel({ items: [] }))).toEqual({
      ok: false,
      error: SHARE_MESSAGES.itemsRequired,
    });

    const tiny = createEncodedShareService({ maxTokenLength: 10, origin: () => 'http://localhost:5173' });
    expect(tiny.createShare(createWheel())).toEqual({
      ok: false,
      error: SHARE_MESSAGES.tooLarge,
    });

    const expiredToken = encodeJsonToBase64Url({
      format: 'spinflow.share',
      version: 1,
      createdAt: '2026-09-01T00:00:00.000Z',
      expiresAt: '2026-10-01T00:00:00.000Z',
      wheel: {
        name: 'Food Picker',
        items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
        settings: DEFAULT_WHEEL_SETTINGS,
      },
    });
    expect(service.resolveShare({ kind: 'encoded', token: expiredToken })).toEqual({
      ok: false,
      error: SHARE_MESSAGES.expired,
      reason: 'expired',
    });

    expect(service.resolveShare({ kind: 'encoded', token: '%%%' })).toEqual({
      ok: false,
      error: SHARE_MESSAGES.invalid,
      reason: 'invalid',
    });
    expect(service.resolveShare({ kind: 'remote', id: 'share-1' })).toEqual({
      ok: false,
      error: SHARE_MESSAGES.unavailable,
      reason: 'unavailable',
    });
  });

  it('rejects resolve when the encoded token exceeds maxTokenLength', () => {
    const tiny = createEncodedShareService({
      now: () => now,
      origin: () => 'http://localhost:5173',
      maxTokenLength: 10,
    });

    expect(tiny.resolveShare({ kind: 'encoded', token: 'a'.repeat(11) })).toEqual({
      ok: false,
      error: SHARE_MESSAGES.invalid,
      reason: 'invalid',
    });
  });

  it('uses create and resolve option overrides for now and origin', () => {
    const created = service.createShare(createWheel(), {
      now: new Date('2026-12-01T00:00:00.000Z'),
      origin: 'https://share.example',
    });

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    expect(created.url.startsWith('https://share.example/share?')).toBe(true);
    expect(created.document.createdAt).toBe('2026-12-01T00:00:00.000Z');

    const resolved = service.resolveShare(
      { kind: 'encoded', token: created.token },
      { now: new Date('2026-12-02T00:00:00.000Z') },
    );
    expect(resolved.ok).toBe(true);
  });

  it('exposes parseLocation, buildSharePath, and buildShareUrl helpers', () => {
    expect(service.parseLocation({ search: `?${SHARE_QUERY_PARAM}=token-1` })).toEqual({
      kind: 'encoded',
      token: 'token-1',
    });
    expect(service.parseLocation({ shareId: 'remote-1' })).toEqual({
      kind: 'remote',
      id: 'remote-1',
    });

    const path = service.buildSharePath('abc_def');
    expect(path).toContain(`${SHARE_QUERY_PARAM}=abc_def`);
    expect(service.buildShareUrl('abc_def', 'http://localhost:5173')).toBe(
      `http://localhost:5173${path}`,
    );
  });

  it('falls back to window origin and current time when factory options are omitted', () => {
    const defaults = createEncodedShareService();
    const created = defaults.createShare(createWheel());

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    expect(created.url.startsWith(window.location.origin)).toBe(true);

    const resolved = defaults.resolveShare({ kind: 'encoded', token: created.token });
    expect(resolved.ok).toBe(true);
  });
});
