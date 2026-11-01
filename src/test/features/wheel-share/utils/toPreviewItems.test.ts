import { toSharePreviewItems } from '@/features/wheel-share/utils/toPreviewItems';

describe('toSharePreviewItems', () => {
  it('assigns ephemeral preview ids that are not the original item names', () => {
    const items = toSharePreviewItems([
      {
        name: 'Pizza',
        color: '#ea580c',
        enabled: true,
        weight: 1,
        children: [{ name: 'Pepperoni', color: '#dc2626', enabled: true, weight: 1 }],
      },
    ]);

    expect(items[0]?.id).toBe('share-0');
    expect(items[0]?.children?.[0]?.id).toBe('share-0-0');
    expect(items[0]?.name).toBe('Pizza');
  });
});
