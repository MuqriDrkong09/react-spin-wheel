import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { parseShareWheel, wheelShareEnvelopeSchema } from '@/features/wheel-share/schema';
import { WHEEL_SHARE_FORMAT, WHEEL_SHARE_VERSION } from '@/features/wheel-share/constants';

describe('wheel share schema', () => {
  it('accepts a share envelope and validates nested wheel items', () => {
    const envelope = wheelShareEnvelopeSchema.safeParse({
      format: WHEEL_SHARE_FORMAT,
      version: WHEEL_SHARE_VERSION,
      createdAt: '2026-11-01T00:00:00.000Z',
      expiresAt: '2026-12-01T00:00:00.000Z',
      wheel: { extra: true },
    });
    expect(envelope.success).toBe(true);

    const wheel = parseShareWheel({
      name: 'Food Picker',
      items: [
        {
          name: 'Pizza',
          color: '#ea580c',
          enabled: true,
          weight: 1,
          children: [{ name: 'Pepperoni', color: '#dc2626', enabled: true, weight: 2 }],
        },
      ],
      settings: DEFAULT_WHEEL_SETTINGS,
    });
    expect(wheel.ok).toBe(true);
  });

  it('rejects invalid colors, weights, and missing required fields', () => {
    expect(parseShareWheel({ name: 'Food Picker', items: [], settings: DEFAULT_WHEEL_SETTINGS }).ok).toBe(false);
    expect(
      parseShareWheel({
        name: 'Food Picker',
        items: [{ name: 'Pizza', color: 'orange', enabled: true, weight: 1 }],
        settings: DEFAULT_WHEEL_SETTINGS,
      }).ok,
    ).toBe(false);
    expect(
      parseShareWheel({
        name: 'Food Picker',
        items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: 0 }],
        settings: DEFAULT_WHEEL_SETTINGS,
      }).ok,
    ).toBe(false);
  });
});
