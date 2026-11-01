import { importWheelNameSchema } from '@/features/wheel-import/schema';
import type { WheelImportDocument, WheelImportItem } from '@/features/wheel-import/types';
import type { CreateWheelInput } from '@/stores/wheelStore';
import type { Wheel, WheelItem } from '@/types/wheel';
import { createId } from '@/utils/id';
import type { NewWheelItemInput } from '@/utils/wheelTree';

export function uniqueImportedName(name: string, existingNames: readonly string[]): string {
  const taken = new Set(existingNames.map((value) => value.trim().toLowerCase()));
  const trimmed = name.trim();
  if (!taken.has(trimmed.toLowerCase())) {
    return trimmed;
  }

  const imported = `${trimmed} (imported)`;
  if (!taken.has(imported.toLowerCase())) {
    return imported;
  }

  let index = 2;
  let candidate = `${trimmed} (imported ${index})`;
  while (taken.has(candidate.toLowerCase())) {
    index += 1;
    candidate = `${trimmed} (imported ${index})`;
  }

  return candidate;
}

export function collectExistingIds(wheels: readonly Wheel[]): Set<string> {
  const ids = new Set<string>();

  for (const wheel of wheels) {
    ids.add(wheel.id);
    addItemIds(wheel.items, ids);
  }

  return ids;
}

export function nextUniqueId(taken: Set<string>): string {
  let id = createId();
  while (taken.has(id)) {
    id = createId();
  }
  taken.add(id);
  return id;
}

export function toCreateWheelInputFromImport(
  document: WheelImportDocument,
  name: string,
  takenIds: Set<string>,
): CreateWheelInput {
  const parsedName = importWheelNameSchema.parse(name);

  return {
    id: nextUniqueId(takenIds),
    name: parsedName,
    description: document.description,
    category: document.category,
    icon: document.icon,
    items: document.items.map((item) => toNewItem(item, takenIds)),
    settings: {
      ...document.settings,
      appearance: {
        ...document.settings.appearance,
        segmentColors: [...document.settings.appearance.segmentColors],
      },
    },
  };
}

function toNewItem(item: WheelImportItem, takenIds: Set<string>): NewWheelItemInput {
  return {
    id: nextUniqueId(takenIds),
    name: item.name,
    description: item.description,
    icon: item.icon,
    color: item.color,
    enabled: item.enabled,
    weight: item.weight,
    children: item.children?.map((child) => toNewItem(child, takenIds)),
  };
}

function addItemIds(items: readonly WheelItem[], ids: Set<string>): void {
  for (const item of items) {
    ids.add(item.id);
    if (item.children) {
      addItemIds(item.children, ids);
    }
  }
}
