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
});
