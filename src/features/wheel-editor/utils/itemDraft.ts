import { ITEM_COLORS } from '@/constants/wheel';
import type { ItemFormValues } from '@/features/wheel-editor/schema';
import type { NewWheelItemInput } from '@/utils/wheelTree';
import type { HexColor } from '@/types/wheel';

export function toItemDraft(values: ItemFormValues, siblingCount: number): NewWheelItemInput {
  return {
    name: values.name,
    icon: values.icon || undefined,
    description: values.description || undefined,
    color: toHexColor(values.color) ?? colorForIndex(siblingCount),
    enabled: true,
    weight: 1,
  };
}

export function colorForIndex(index: number): HexColor {
  return ITEM_COLORS[index % ITEM_COLORS.length] ?? '#4f46e5';
}

function toHexColor(value: string): HexColor | undefined {
  return value.startsWith('#') ? (value as HexColor) : undefined;
}
