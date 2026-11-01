import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import type { WheelExportDocument, WheelExportItem } from '@/features/wheel-export/types';
import type { Wheel, WheelItem } from '@/types/wheel';

export function toWheelExportDocument(wheel: Wheel): WheelExportDocument {
  return {
    format: WHEEL_EXPORT_FORMAT,
    version: WHEEL_EXPORT_VERSION,
    name: wheel.name.trim(),
    description: optionalText(wheel.description),
    category: optionalText(wheel.category),
    icon: optionalText(wheel.icon),
    items: wheel.items.map(toWheelExportItem),
    settings: {
      ...wheel.settings,
      appearance: {
        ...wheel.settings.appearance,
        segmentColors: [...wheel.settings.appearance.segmentColors],
      },
    },
  };
}

export function toWheelExportItem(item: WheelItem): WheelExportItem {
  const children = item.children?.map(toWheelExportItem);

  return {
    name: item.name.trim(),
    description: optionalText(item.description),
    icon: optionalText(item.icon),
    color: item.color,
    enabled: item.enabled,
    weight: item.weight,
    ...(children && children.length > 0 ? { children } : {}),
  };
}

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
