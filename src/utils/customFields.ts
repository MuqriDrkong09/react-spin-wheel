import {
  CUSTOM_FIELD_TYPE,
  type CustomFieldDefinition,
  type CustomFieldValue,
  type CustomFieldValues,
} from '@/types/customFields';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const URL_PATTERN = /^https?:\/\/\S+$/i;

/** Build empty form-friendly values for every definition. */
export function defaultCustomFieldFormValues(
  definitions: readonly CustomFieldDefinition[],
  existing?: CustomFieldValues,
): Record<string, CustomFieldValue> {
  const values: Record<string, CustomFieldValue> = {};

  for (const definition of definitions) {
    const current = existing?.[definition.id];
    if (current !== undefined && current !== null) {
      values[definition.id] = current;
      continue;
    }

    values[definition.id] = defaultValueForType(definition.type);
  }

  return values;
}

export function defaultValueForType(type: CustomFieldDefinition['type']): CustomFieldValue {
  switch (type) {
    case CUSTOM_FIELD_TYPE.boolean:
      return false;
    case CUSTOM_FIELD_TYPE.multiSelect:
      return [];
    case CUSTOM_FIELD_TYPE.number:
    case CUSTOM_FIELD_TYPE.text:
    case CUSTOM_FIELD_TYPE.select:
    case CUSTOM_FIELD_TYPE.date:
    case CUSTOM_FIELD_TYPE.url:
    default:
      // Empty string keeps controlled MUI inputs stable; sanitized to null on save.
      return '';
  }
}

/**
 * Normalize and validate values against definitions.
 * Unknown field ids are dropped. Invalid values become null (or fail required).
 */
export function sanitizeCustomFieldValues(
  definitions: readonly CustomFieldDefinition[],
  values: CustomFieldValues | undefined,
): { values?: CustomFieldValues; ok: boolean; error?: string } {
  if (!definitions.length) {
    return { values: undefined, ok: true };
  }

  const next: CustomFieldValues = {};
  const source = values ?? {};

  for (const definition of definitions) {
    const raw = source[definition.id];
    const parsed = coerceCustomFieldValue(definition, raw);

    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }

    if (definition.required && isEmptyCustomFieldValue(parsed.value)) {
      return { ok: false, error: `${definition.label} is required` };
    }

    if (!isEmptyCustomFieldValue(parsed.value)) {
      next[definition.id] = parsed.value;
    }
  }

  return {
    ok: true,
    values: Object.keys(next).length > 0 ? next : undefined,
  };
}

export function coerceCustomFieldValue(
  definition: CustomFieldDefinition,
  raw: unknown,
): { ok: true; value: CustomFieldValue } | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === '') {
    return { ok: true, value: null };
  }

  switch (definition.type) {
    case CUSTOM_FIELD_TYPE.text:
    case CUSTOM_FIELD_TYPE.select: {
      if (typeof raw !== 'string') {
        return { ok: false, error: `${definition.label} must be text` };
      }
      const trimmed = raw.trim();
      if (
        definition.type === CUSTOM_FIELD_TYPE.select &&
        trimmed &&
        definition.options &&
        !definition.options.includes(trimmed)
      ) {
        return { ok: false, error: `${definition.label} must be one of the options` };
      }
      return { ok: true, value: trimmed || null };
    }
    case CUSTOM_FIELD_TYPE.number: {
      const number = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(number)) {
        return { ok: false, error: `${definition.label} must be a number` };
      }
      return { ok: true, value: number };
    }
    case CUSTOM_FIELD_TYPE.boolean:
      if (typeof raw !== 'boolean') {
        return { ok: false, error: `${definition.label} must be true or false` };
      }
      return { ok: true, value: raw };
    case CUSTOM_FIELD_TYPE.multiSelect: {
      if (!Array.isArray(raw) || raw.some((entry) => typeof entry !== 'string')) {
        return { ok: false, error: `${definition.label} must be a list of options` };
      }
      const selected = raw.map((entry) => entry.trim()).filter(Boolean);
      const options = new Set(definition.options ?? []);
      if (selected.some((entry) => !options.has(entry))) {
        return { ok: false, error: `${definition.label} has an invalid option` };
      }
      return { ok: true, value: selected };
    }
    case CUSTOM_FIELD_TYPE.date: {
      if (typeof raw !== 'string' || !ISO_DATE.test(raw.trim())) {
        return { ok: false, error: `${definition.label} must be a date (YYYY-MM-DD)` };
      }
      return { ok: true, value: raw.trim() };
    }
    case CUSTOM_FIELD_TYPE.url: {
      if (typeof raw !== 'string') {
        return { ok: false, error: `${definition.label} must be a URL` };
      }
      const trimmed = raw.trim();
      if (!trimmed) {
        return { ok: true, value: null };
      }
      if (!URL_PATTERN.test(trimmed)) {
        return { ok: false, error: `${definition.label} must be a valid http(s) URL` };
      }
      return { ok: true, value: trimmed };
    }
    default:
      return { ok: false, error: `${definition.label} has an unsupported type` };
  }
}

export function isEmptyCustomFieldValue(value: CustomFieldValue | undefined): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

/** Human-readable display for item details. */
export function formatCustomFieldValue(
  definition: CustomFieldDefinition,
  value: CustomFieldValue | undefined,
): string {
  if (isEmptyCustomFieldValue(value) || value === undefined) {
    return '—';
  }

  switch (definition.type) {
    case CUSTOM_FIELD_TYPE.boolean:
      return value ? 'Yes' : 'No';
    case CUSTOM_FIELD_TYPE.multiSelect:
      return Array.isArray(value) ? value.join(', ') : String(value);
    default:
      return String(value);
  }
}

export function slugifyFieldKey(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

  if (!slug) {
    return 'field';
  }

  return /^[a-z]/.test(slug) ? slug : `field_${slug}`;
}

export function uniqueFieldKey(base: string, existing: readonly string[]): string {
  const taken = new Set(existing.map((value) => value.toLowerCase()));
  if (!taken.has(base.toLowerCase())) {
    return base;
  }

  let index = 2;
  let candidate = `${base}_${index}`;
  while (taken.has(candidate.toLowerCase())) {
    index += 1;
    candidate = `${base}_${index}`;
  }
  return candidate;
}
