import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';

describe('EDITOR_MESSAGES', () => {
  it('keeps the static copy used by the editor', () => {
    expect(EDITOR_MESSAGES.nameRequired).toBe('Enter an item name');
    expect(EDITOR_MESSAGES.childNameRequired).toBe('Enter a child name');
    expect(EDITOR_MESSAGES.nameMax).toBe('Name must be at most 100 characters');
    expect(EDITOR_MESSAGES.weightMin).toBe('Weight must be at least 1');
    expect(EDITOR_MESSAGES.noWheelTitle).toBe('No wheel selected');
    expect(EDITOR_MESSAGES.noWheelDescription).toBe(
      'Create a wheel or open one from the dashboard to edit its items.',
    );
    expect(EDITOR_MESSAGES.chooseWheelDescription).toBe('Select a wheel to open it in the editor.');
    expect(EDITOR_MESSAGES.changeWheel).toBe('Choose another wheel');
  });

  it('builds action and success copy from names', () => {
    expect(EDITOR_MESSAGES.chooseWheelAction('Food Wheel')).toBe('Edit Food Wheel');
    expect(EDITOR_MESSAGES.itemAdded('Taco')).toBe('Taco added.');
    expect(EDITOR_MESSAGES.childAdded('Salmon', 'Sushi')).toBe('Salmon added under Sushi.');
    expect(EDITOR_MESSAGES.itemUpdated('Deep Dish')).toBe('Deep Dish updated.');
    expect(EDITOR_MESSAGES.emptyChildren('Sushi')).toBe('No child items under Sushi yet.');
    expect(EDITOR_MESSAGES.deleteItem('Pizza')).toBe('Delete Pizza? This cannot be undone.');
  });

  it('formats item counts in singular and plural', () => {
    expect(EDITOR_MESSAGES.itemCount(1)).toBe('1 item');
    expect(EDITOR_MESSAGES.itemCount(0)).toBe('0 items');
    expect(EDITOR_MESSAGES.itemCount(3)).toBe('3 items');
  });

  it('warns about one or many descendants', () => {
    expect(EDITOR_MESSAGES.deleteDescendantsWarning(1)).toBe(
      'All descendants will also be deleted (1 item).',
    );
    expect(EDITOR_MESSAGES.deleteDescendantsWarning(2)).toBe(
      'All descendants will also be deleted (2 items).',
    );
  });

  it('announces drag-and-drop moves', () => {
    expect(EDITOR_MESSAGES.dndPickedUp('Pizza')).toBe('Picked up Pizza.');
    expect(EDITOR_MESSAGES.dndMovedOver('Pizza', 'Burger')).toBe('Pizza is over Burger.');
    expect(EDITOR_MESSAGES.dndDropped('Pizza')).toBe('Dropped Pizza.');
    expect(EDITOR_MESSAGES.dndCancelled('Pizza')).toBe('Moving Pizza cancelled.');
  });
});
