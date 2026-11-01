import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { WHEEL_SHARE_FORMAT, WHEEL_SHARE_VERSION } from '@/features/wheel-share/constants';
import type { WheelShareDocument } from '@/features/wheel-share/types';
import {
  toCreateWheelInputFromShare,
  uniqueCopyName,
} from '@/features/wheel-share/utils/toCreateWheelInputFromShare';

const document: WheelShareDocument = {
  format: WHEEL_SHARE_FORMAT,
  version: WHEEL_SHARE_VERSION,
  createdAt: '2026-11-01T00:00:00.000Z',
  expiresAt: '2026-12-01T00:00:00.000Z',
  wheel: {
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
  },
};

describe('toCreateWheelInputFromShare', () => {
  it('creates a copy with new ids', () => {
    const input = toCreateWheelInputFromShare(document, 'Dinner Wheel', new Set(['taken']));

    expect(input.name).toBe('Dinner Wheel');
    expect(input.id).toBeDefined();
    expect(input.id).not.toBe('taken');
    expect(input.items?.[0]?.name).toBe('Pizza');
    expect(input.items?.[0]?.id).not.toBe('share-0');
    expect(input.items?.[0]?.children?.[0]?.name).toBe('Pepperoni');
    expect(input.settings?.appearance?.segmentColors).toEqual(DEFAULT_WHEEL_SETTINGS.appearance.segmentColors);
  });
});

describe('uniqueCopyName', () => {
  it('keeps a unique name and suffixes collisions as copies', () => {
    expect(uniqueCopyName('Food Picker', [])).toBe('Food Picker');
    expect(uniqueCopyName('Food Picker', ['Food Picker'])).toBe('Food Picker (copy)');
    expect(uniqueCopyName('Food Picker', ['Food Picker', 'Food Picker (copy)'])).toBe('Food Picker (copy 2)');
  });
});
