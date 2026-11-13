import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { SHARE_MESSAGES, WHEEL_SHARE_FORMAT, WHEEL_SHARE_VERSION } from '@/features/wheel-share/constants';
import { parseShareDocument } from '@/features/wheel-share/utils/parseShareDocument';

const now = new Date('2026-11-01T12:00:00.000Z');

function validDocument(overrides: Record<string, unknown> = {}) {
  return {
    format: WHEEL_SHARE_FORMAT,
    version: WHEEL_SHARE_VERSION,
    createdAt: '2026-11-01T00:00:00.000Z',
    expiresAt: '2026-12-01T00:00:00.000Z',
    wheel: {
      name: 'Food Picker',
      items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
      settings: DEFAULT_WHEEL_SETTINGS,
    },
    ...overrides,
  };
}

describe('parseShareDocument', () => {
  it('accepts a valid share document and strips unknown wheel keys', () => {
    const result = parseShareDocument(
      {
        ...validDocument(),
        favoriteWheelIds: ['secret'],
        wheel: {
          id: 'food-picker',
          name: 'Food Picker',
          items: [{ id: 'pizza', name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
          settings: DEFAULT_WHEEL_SETTINGS,
          conditions: [{ kind: 'always' }],
        },
      },
      now,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.wheel).not.toHaveProperty('id');
      expect(result.document.wheel.items[0]).not.toHaveProperty('id');
      expect(result.document.wheel).not.toHaveProperty('conditions');
      expect(result.document).not.toHaveProperty('favoriteWheelIds');
    }
  });

  it('rejects expired, malformed, and incomplete payloads', () => {
    expect(
      parseShareDocument(
        validDocument({
          createdAt: '2026-09-01T00:00:00.000Z',
          expiresAt: '2026-10-01T00:00:00.000Z',
        }),
        now,
      ),
    ).toEqual({
      ok: false,
      error: SHARE_MESSAGES.expired,
      reason: 'expired',
    });
    expect(parseShareDocument({ hello: true }, now)).toEqual({
      ok: false,
      error: SHARE_MESSAGES.invalid,
      reason: 'invalid',
    });
    expect(
      parseShareDocument(validDocument({ wheel: { name: 'Food Picker', items: [], settings: DEFAULT_WHEEL_SETTINGS } }), now),
    ).toEqual({
      ok: false,
      error: SHARE_MESSAGES.invalid,
      reason: 'invalid',
    });
  });

  it('rejects envelopes whose expiry is earlier than createdAt', () => {
    expect(
      parseShareDocument(
        validDocument({
          createdAt: '2026-11-01T00:00:00.000Z',
          expiresAt: '2026-10-01T00:00:00.000Z',
        }),
        now,
      ),
    ).toEqual({
      ok: false,
      error: SHARE_MESSAGES.invalid,
      reason: 'invalid',
    });
  });
});
