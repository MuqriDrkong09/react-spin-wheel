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
  emptyChildren: (name: string) => `No child items under ${name} yet.`,
  deleteItem: (name: string) => `Delete ${name}? This cannot be undone.`,
  deleteDescendantsWarning: (count: number) =>
    count === 1
      ? 'All descendants will also be deleted (1 item).'
      : `All descendants will also be deleted (${count} items).`,
} as const;
