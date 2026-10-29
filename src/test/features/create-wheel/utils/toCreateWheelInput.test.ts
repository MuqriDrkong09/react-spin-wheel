import { ITEM_COLORS } from '@/constants/wheel';
import type { CreateWheelFormValues } from '@/features/create-wheel/schema';
import { toCreateWheelInput } from '@/features/create-wheel/utils/toCreateWheelInput';

const values: CreateWheelFormValues = {
  name: 'Pizza Night',
  description: 'Weekend dinner',
  category: 'Food',
  icon: '🍕',
  items: [{ name: 'Pepperoni' }, { name: 'Margherita' }],
};

describe('toCreateWheelInput', () => {
  it('maps form values to a wheel draft with default item settings', () => {
    expect(toCreateWheelInput(values)).toEqual({
      name: 'Pizza Night',
      description: 'Weekend dinner',
      category: 'Food',
      icon: '🍕',
      items: [
        {
          name: 'Pepperoni',
          color: ITEM_COLORS[0],
          enabled: true,
          weight: 1,
        },
        {
          name: 'Margherita',
          color: ITEM_COLORS[1],
          enabled: true,
          weight: 1,
        },
      ],
    });
  });

  it('omits empty optional fields', () => {
    expect(
      toCreateWheelInput({
        ...values,
        description: '',
        category: '',
        icon: '',
        items: [{ name: 'Pepperoni' }],
      }),
    ).toMatchObject({
      description: undefined,
      category: undefined,
      icon: undefined,
    });
  });

  it('maps an empty option list', () => {
    expect(toCreateWheelInput({ ...values, items: [] }).items).toEqual([]);
  });

  it('cycles palette colors when there are more options than colors', () => {
    const items = [...ITEM_COLORS.map((_, index) => ({ name: `Option ${index + 1}` })), { name: 'Wrapped' }];
    const result = toCreateWheelInput({ ...values, items });

    expect(result.items.map((item) => item.color)).toEqual([...ITEM_COLORS, ITEM_COLORS[0]]);
    expect(result.items.every((item) => item.enabled && item.weight === 1)).toBe(true);
  });

  it('falls back to indigo when a palette slot is missing', async () => {
    vi.resetModules();
    vi.doMock('@/constants/wheel', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/constants/wheel')>();
      return { ...actual, ITEM_COLORS: [] };
    });

    const { toCreateWheelInput: mapWithEmptyPalette } = await import(
      '@/features/create-wheel/utils/toCreateWheelInput'
    );

    expect(mapWithEmptyPalette({ ...values, items: [{ name: 'Pepperoni' }] }).items[0]?.color).toBe(
      '#4f46e5',
    );
  });
});
