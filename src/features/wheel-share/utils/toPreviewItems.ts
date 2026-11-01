import type { WheelShareWheel } from '@/features/wheel-share/types';
import type { WheelExportItem } from '@/features/wheel-export/types';
import type { WheelItem } from '@/types/wheel';

const PREVIEW_TIMESTAMP = '1970-01-01T00:00:00.000Z';

export function toSharePreviewItems(
  items: WheelShareWheel['items'],
  path = 'share',
): WheelItem[] {
  return items.map((item, index) => toPreviewItem(item, `${path}-${index}`));
}

function toPreviewItem(item: WheelExportItem, id: string): WheelItem {
  return {
    id,
    name: item.name,
    description: item.description,
    icon: item.icon,
    color: item.color,
    enabled: item.enabled,
    weight: item.weight,
    createdAt: PREVIEW_TIMESTAMP,
    updatedAt: PREVIEW_TIMESTAMP,
    children: item.children?.map((child, index) => toPreviewItem(child, `${id}-${index}`)),
  };
}
