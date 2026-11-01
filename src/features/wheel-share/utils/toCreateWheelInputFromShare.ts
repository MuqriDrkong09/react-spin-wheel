import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { toCreateWheelInputFromImport } from '@/features/wheel-import/utils/toCreateWheelInputFromImport';
import type { WheelShareDocument } from '@/features/wheel-share/types';
import type { CreateWheelInput } from '@/stores/wheelStore';

export function uniqueCopyName(name: string, existingNames: readonly string[]): string {
  const taken = new Set(existingNames.map((value) => value.trim().toLowerCase()));
  const trimmed = name.trim();
  if (!taken.has(trimmed.toLowerCase())) {
    return trimmed;
  }

  const copy = `${trimmed} (copy)`;
  if (!taken.has(copy.toLowerCase())) {
    return copy;
  }

  let index = 2;
  let candidate = `${trimmed} (copy ${index})`;
  while (taken.has(candidate.toLowerCase())) {
    index += 1;
    candidate = `${trimmed} (copy ${index})`;
  }

  return candidate;
}

export function toCreateWheelInputFromShare(
  document: WheelShareDocument,
  name: string,
  takenIds: Set<string>,
): CreateWheelInput {
  return toCreateWheelInputFromImport(
    {
      format: WHEEL_EXPORT_FORMAT,
      version: WHEEL_EXPORT_VERSION,
      name: document.wheel.name,
      description: document.wheel.description,
      category: document.wheel.category,
      icon: document.wheel.icon,
      items: document.wheel.items,
      settings: document.wheel.settings,
    },
    name,
    takenIds,
  );
}
