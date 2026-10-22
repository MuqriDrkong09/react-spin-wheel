export const EDITOR_MESSAGES = {
  nameRequired: 'Enter an item name',
  nameMax: 'Name must be at most 100 characters',
  noWheelTitle: 'No wheel selected',
  noWheelDescription: 'Create a wheel or open one from the dashboard to edit its items.',
  emptyChildren: (name: string) => `No child items under ${name} yet.`,
  deleteItem: (name: string) => `Delete ${name}? This cannot be undone.`,
  deleteItemWithChildren: (name: string, count: number) =>
    `Delete ${name} and ${count} ${count === 1 ? 'child item' : 'child items'}? This cannot be undone.`,
} as const;
