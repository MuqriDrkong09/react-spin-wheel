import { ITEM_COLORS } from '@/constants/wheel';
import type { PresetItemDefinition } from '@/features/presets/types';
import type { HexColor, WheelItem } from '@/types/wheel';

const PREVIEW_TIMESTAMP = '1970-01-01T00:00:00.000Z';

export function toPreviewItems(
  items: readonly PresetItemDefinition[],
  path = 'preset',
  colorStart = 0,
): WheelItem[] {
  return items.map((item, index) => {
    const id = `${path}-${index}`;

    return {
      id,
      name: item.name,
      description: item.description,
      icon: item.icon,
      color: item.color ?? colorAt(colorStart + index),
      enabled: true,
      weight: item.weight ?? 1,
      createdAt: PREVIEW_TIMESTAMP,
      updatedAt: PREVIEW_TIMESTAMP,
      children: item.children ? toPreviewItems(item.children, id) : undefined,
    };
  });
}

function colorAt(index: number): HexColor {
  return ITEM_COLORS[index % ITEM_COLORS.length] ?? '#4f46e5';
}
