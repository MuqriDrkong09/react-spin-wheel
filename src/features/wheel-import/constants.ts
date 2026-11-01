export const MAX_IMPORT_BYTES = 1_048_576;

export const IMPORT_MESSAGES = {
  success: (name: string) => `Imported ${name}.`,
  malformed: 'This file is not valid JSON.',
  empty: 'This file is empty.',
  tooLarge: 'This file is too large to import.',
  notWheel: 'This file is not a Spinflow wheel export.',
  nameRequired: 'Enter a wheel name.',
  itemNameRequired: 'Each item needs a name.',
  itemsRequired: 'Add at least one item.',
  invalidColor: 'Each color must be a 6-digit hex value such as #4f46e5.',
  invalidWeight: 'Each item weight must be a number of at least 1.',
  invalidId: 'Imported ids must be unique, non-empty, and URL-safe.',
  invalidSettings: 'Wheel settings are incomplete or invalid.',
  invalidChildren: 'Child items must be a valid nested list.',
  invalid: 'This wheel JSON is not valid and cannot be imported.',
} as const;
