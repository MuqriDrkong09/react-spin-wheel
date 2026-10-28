import { ITEM_COLORS } from '@/constants/wheel';
import type { PresetItemDefinition, WheelPresetDefinition } from '@/features/presets/types';
import type { CreateWheelInput } from '@/stores/wheelStore';
import type { HexColor } from '@/types/wheel';
import type { NewWheelItemInput } from '@/utils/wheelTree';

export function clonePresetDefinition(preset: WheelPresetDefinition): WheelPresetDefinition {
  return {
    ...preset,
    items: cloneItemDefinitions(preset.items),
  };
}

export function cloneItemDefinitions(
  items: readonly PresetItemDefinition[],
): PresetItemDefinition[] {
  return items.map((item) => ({
    ...item,
    children: item.children ? cloneItemDefinitions(item.children) : undefined,
  }));
}

export function toCreateWheelInputFromPreset(preset: WheelPresetDefinition): CreateWheelInput {
  return {
    name: preset.name,
    description: preset.description,
    category: preset.category,
    icon: preset.icon,
    items: toNewWheelItems(preset.items),
  };
}

export function countPresetItems(items: readonly PresetItemDefinition[]): number {
  return items.reduce(
    (total, item) => total + 1 + countPresetItems(item.children ?? []),
    0,
  );
}

export function countPresetRoots(items: readonly PresetItemDefinition[]): number {
  return items.length;
}

export function countPresetChildren(items: readonly PresetItemDefinition[]): number {
  return Math.max(0, countPresetItems(items) - countPresetRoots(items));
}

function toNewWheelItems(
  items: readonly PresetItemDefinition[],
  colorStart = 0,
): NewWheelItemInput[] {
  return items.map((item, index) => ({
    name: item.name,
    description: item.description,
    icon: item.icon,
    color: item.color ?? colorAt(colorStart + index),
    enabled: true,
    weight: item.weight ?? 1,
    children: item.children ? toNewWheelItems(item.children) : undefined,
  }));
}

function colorAt(index: number): HexColor {
  return ITEM_COLORS[index % ITEM_COLORS.length] ?? '#4f46e5';
}
