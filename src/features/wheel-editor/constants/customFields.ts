import { CUSTOM_FIELD_TYPE, type CustomFieldType } from '@/types/customFields';

export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  [CUSTOM_FIELD_TYPE.text]: 'Text',
  [CUSTOM_FIELD_TYPE.number]: 'Number',
  [CUSTOM_FIELD_TYPE.boolean]: 'Boolean',
  [CUSTOM_FIELD_TYPE.select]: 'Select',
  [CUSTOM_FIELD_TYPE.multiSelect]: 'Multi-select',
  [CUSTOM_FIELD_TYPE.date]: 'Date',
  [CUSTOM_FIELD_TYPE.url]: 'URL',
};

export const CUSTOM_FIELD_MESSAGES = {
  title: 'Custom fields',
  description: 'Define extra fields for every item on this wheel. Values are edited per item.',
  addField: 'Add field',
  label: 'Label',
  key: 'Key',
  type: 'Type',
  options: 'Options (comma-separated)',
  optionsHint: 'Required for select and multi-select',
  required: 'Required',
  removeField: (label: string) => `Remove ${label}`,
  empty: 'No custom fields yet. Add one to collect extra item details.',
  labelRequired: 'Enter a field label',
  optionsRequired: 'Add at least one option',
  detailsHeading: 'Custom fields',
} as const;
