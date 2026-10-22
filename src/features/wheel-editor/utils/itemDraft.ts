import { ITEM_COLORS } from '@/constants/wheel';
import type { ItemFormValues } from '@/features/wheel-editor/schema';
import type { HexColor } from '@/types/wheel';
import type { NewWheelItemInput } from '@/utils/wheelTree';

export function toItemDraft(values: ItemFormValues, siblingCount: number): NewWheelItemInput {
  return {
    name: values.name,
    description: values.description || undefined,
    icon: values.icon || undefined,
    color: toHexColor(values.color) ?? colorForIndex(siblingCount),
    enabled: values.enabled,
    weight: values.weight,
  };
}

export function colorForIndex(index: number): HexColor {
  return ITEM_COLORS[index % ITEM_COLORS.length] ?? '#4f46e5';
}

function toHexColor(value: string): HexColor | undefined {
  return value.startsWith('#') ? (value as HexColor) : undefined;
}
