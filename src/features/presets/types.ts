import type { HexColor, WheelPresetId } from '@/types/wheel';

export interface PresetItemDefinition {
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly color?: HexColor;
  readonly weight?: number;
  readonly children?: readonly PresetItemDefinition[];
}

export interface WheelPresetDefinition {
  readonly id: WheelPresetId;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly icon: string;
  readonly items: readonly PresetItemDefinition[];
}
