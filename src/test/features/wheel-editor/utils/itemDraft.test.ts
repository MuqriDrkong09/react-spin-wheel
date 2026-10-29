import { defaultItemFormValues } from '@/features/wheel-editor/schema';
import { toItemDraft, toItemPatch } from '@/features/wheel-editor/utils/itemDraft';

describe('toItemDraft', () => {
  it('maps form values onto a new wheel item', () => {
    expect(
      toItemDraft(
        {
          ...defaultItemFormValues,
          name: 'Pizza',
          description: 'Dinner',
          icon: '🍕',
          color: '#ea580c',
          weight: 2,
          enabled: false,
        },
        0,
      ),
    ).toEqual({
      name: 'Pizza',
      description: 'Dinner',
      icon: '🍕',
      color: '#ea580c',
      weight: 2,
      enabled: false,
    });
  });

  it('uses enabled and weight defaults from the form', () => {
    expect(toItemDraft({ ...defaultItemFormValues, name: 'Sushi' }, 1)).toMatchObject({
      name: 'Sushi',
      enabled: true,
      weight: 1,
    });
  });
});

describe('toItemPatch', () => {
  it('maps form values without children or timestamps', () => {
    expect(
      toItemPatch({
        ...defaultItemFormValues,
        name: 'Deep Dish',
        description: 'Thick crust',
        icon: '🍕',
        color: '#ea580c',
        weight: 2,
        enabled: false,
      }),
    ).toEqual({
      name: 'Deep Dish',
      description: 'Thick crust',
      icon: '🍕',
      color: '#ea580c',
      weight: 2,
      enabled: false,
    });
  });
});
