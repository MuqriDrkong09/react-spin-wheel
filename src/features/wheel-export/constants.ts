export const WHEEL_EXPORT_FORMAT = 'spinflow.wheel' as const;

export const WHEEL_EXPORT_VERSION = 1 as const;

export const WHEEL_EXPORT_EXTENSION = '.json';

export const EXPORT_MESSAGES = {
  success: (name: string, filename: string) => `Exported ${name} as ${filename}.`,
  notFound: 'This wheel is missing or was deleted.',
  nameRequired: 'Add a wheel name before exporting.',
  itemNameRequired: 'Each item needs a name before exporting.',
  itemsRequired: 'Add at least one item before exporting.',
  invalidColor: 'Each item needs a valid color before exporting.',
  invalidWeight: 'Each item needs a weight of at least 1 before exporting.',
  invalidSettings: 'Wheel settings are incomplete or invalid.',
  invalid: 'This wheel cannot be exported until its data is valid.',
  downloadFailed: 'The export file could not be downloaded. Try again.',
} as const;
