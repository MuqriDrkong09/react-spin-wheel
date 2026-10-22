import { ITEM_COLORS } from '@/constants/wheel';
import type { CreateWheelFormValues } from '@/features/create-wheel/schema';
import type { CreateWheelInput } from '@/stores/wheelStore';
import type { HexColor } from '@/types/wheel';

export function toCreateWheelInput(values: CreateWheelFormValues): CreateWheelInput {
  return {
    name: values.name,
    description: values.description || undefined,
    category: values.category || undefined,
    icon: values.icon || undefined,
    items: values.items.map((item, index) => ({
      name: item.name,
      color: itemColorAt(index),
      enabled: true,
      weight: 1,
    })),
  };
}

function itemColorAt(index: number): HexColor {
  const color = ITEM_COLORS[index % ITEM_COLORS.length];
  return color ?? '#4f46e5';
}
