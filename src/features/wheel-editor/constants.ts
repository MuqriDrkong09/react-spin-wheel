export const EDITOR_MESSAGES = {
  nameRequired: 'Enter an item name',
  childNameRequired: 'Enter a child name',
  nameMax: 'Name must be at most 100 characters',
  weightMin: 'Weight must be at least 1',
  itemAdded: (name: string) => `${name} added.`,
  childAdded: (name: string, parentName: string) => `${name} added under ${parentName}.`,
  itemUpdated: (name: string) => `${name} updated.`,
  noWheelTitle: 'No wheel selected',
  noWheelDescription: 'Create a wheel or open one from the dashboard to edit its items.',
  chooseWheelDescription: 'Select a wheel to open it in the editor.',
  chooseWheelAction: (name: string) => `Edit ${name}`,
  changeWheel: 'Choose another wheel',
  itemCount: (count: number) => (count === 1 ? '1 item' : `${count} items`),
  emptyChildren: (name: string) => `No child items under ${name} yet.`,
  deleteItem: (name: string) => `Delete ${name}? This cannot be undone.`,
  deleteDescendantsWarning: (count: number) =>
    count === 1
      ? 'All descendants will also be deleted (1 item).'
      : `All descendants will also be deleted (${count} items).`,
  dndPickedUp: (name: string) => `Picked up ${name}.`,
  dndMovedOver: (name: string, overName: string) => `${name} is over ${overName}.`,
  dndDropped: (name: string) => `Dropped ${name}.`,
  dndCancelled: (name: string) => `Moving ${name} cancelled.`,
} as const;
