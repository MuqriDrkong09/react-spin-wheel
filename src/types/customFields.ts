export type CustomFieldId = string;

export const CUSTOM_FIELD_TYPE = {
  text: 'text',
  number: 'number',
  boolean: 'boolean',
  select: 'select',
  multiSelect: 'multiSelect',
  date: 'date',
  url: 'url',
} as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPE)[keyof typeof CUSTOM_FIELD_TYPE];

export function isCustomFieldType(value: string): value is CustomFieldType {
  return Object.values(CUSTOM_FIELD_TYPE).includes(value as CustomFieldType);
}

/** Wheel-level definition that items can fill with values. */
export interface CustomFieldDefinition {
  id: CustomFieldId;
  /** Stable slug used in exports and details (e.g. "cuisine"). */
  key: string;
  label: string;
  type: CustomFieldType;
  /** Required for select / multi-select. */
  options?: string[];
  required?: boolean;
}

/**
 * Persisted value for one custom field.
 * `null` clears an optional field; multi-select uses string[].
 */
export type CustomFieldValue = string | number | boolean | string[] | null;

export type CustomFieldValues = Record<CustomFieldId, CustomFieldValue>;
