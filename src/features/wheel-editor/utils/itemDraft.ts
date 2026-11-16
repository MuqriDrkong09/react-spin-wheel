import { ITEM_COLORS } from '@/constants/wheel';
import type { ItemFormValues } from '@/features/wheel-editor/schema';
import type { CustomFieldDefinition } from '@/types/customFields';
import type { HexColor } from '@/types/wheel';
import { sanitizeCustomFieldValues } from '@/utils/customFields';
import type { NewWheelItemInput, WheelItemPatch } from '@/utils/wheelTree';

export function toItemDraft(
  values: ItemFormValues,
  siblingCount: number,
  definitions: readonly CustomFieldDefinition[] = [],
): NewWheelItemInput {
  return {
    ...toItemFields(values, definitions),
    color: toHexColor(values.color) ?? colorForIndex(siblingCount),
  };
}

export function toItemPatch(
  values: ItemFormValues,
  definitions: readonly CustomFieldDefinition[] = [],
): WheelItemPatch {
  return toItemFields(values, definitions);
}

function toItemFields(
  values: ItemFormValues,
  definitions: readonly CustomFieldDefinition[],
): WheelItemPatch {
  const color = toHexColor(values.color);
  const sanitized = sanitizeCustomFieldValues(definitions, values.customFields);

  return {
    name: values.name,
    description: values.description || undefined,
    icon: values.icon || undefined,
    ...(color ? { color } : {}),
    enabled: values.enabled,
    weight: values.weight,
    // Always set so edits can clear values when definitions exist; undefined when none.
    customFields: sanitized.ok ? sanitized.values : undefined,
  };
}

export function colorForIndex(index: number): HexColor {
  return ITEM_COLORS[index % ITEM_COLORS.length] ?? '#4f46e5';
}

function toHexColor(value: string): HexColor | undefined {
  return value.startsWith('#') ? (value as HexColor) : undefined;
}
