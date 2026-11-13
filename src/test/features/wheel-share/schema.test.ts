import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WHEEL_SHARE_FORMAT, WHEEL_SHARE_VERSION } from '@/features/wheel-share/constants';
import { parseShareWheel, wheelShareEnvelopeSchema } from '@/features/wheel-share/schema';

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
      description: 'Weekend dinner',
      category: 'Food',
      icon: '🍕',
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
    if (!wheel.ok) {
      return;
    }

    expect(wheel.wheel).toMatchObject({
      name: 'Food Picker',
      description: 'Weekend dinner',
      category: 'Food',
      icon: '🍕',
    });
    expect(wheel.wheel).not.toHaveProperty('format');
    expect(wheel.wheel).not.toHaveProperty('version');
    expect(wheel.wheel.items[0]?.children?.[0]?.name).toBe('Pepperoni');
  });

  it('accepts envelope timestamps without milliseconds', () => {
    const envelope = wheelShareEnvelopeSchema.safeParse({
      format: WHEEL_SHARE_FORMAT,
      version: WHEEL_SHARE_VERSION,
      createdAt: '2026-11-01T00:00:00Z',
      expiresAt: '2026-12-01T00:00:00Z',
      wheel: {},
    });

    expect(envelope.success).toBe(true);
  });

  it('rejects invalid envelope timestamps', () => {
    expect(
      wheelShareEnvelopeSchema.safeParse({
        format: WHEEL_SHARE_FORMAT,
        version: WHEEL_SHARE_VERSION,
        createdAt: 'not-a-date',
        expiresAt: '2026-12-01T00:00:00.000Z',
        wheel: {},
      }).success,
    ).toBe(false);

    expect(
      wheelShareEnvelopeSchema.safeParse({
        format: WHEEL_SHARE_FORMAT,
        version: WHEEL_SHARE_VERSION,
        createdAt: '2026-13-40T00:00:00.000Z',
        expiresAt: '2026-12-01T00:00:00.000Z',
        wheel: {},
      }).success,
    ).toBe(false);
  });

  it('rejects non-object wheel payloads before schema validation', () => {
    expect(parseShareWheel(null).ok).toBe(false);
    expect(parseShareWheel(undefined).ok).toBe(false);
    expect(parseShareWheel([]).ok).toBe(false);
    expect(parseShareWheel(42).ok).toBe(false);
    expect(parseShareWheel('wheel').ok).toBe(false);
  });

  it('rejects invalid colors, weights, and missing required fields', () => {
    expect(parseShareWheel({ name: 'Food Picker', items: [], settings: DEFAULT_WHEEL_SETTINGS }).ok).toBe(
      false,
    );
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
