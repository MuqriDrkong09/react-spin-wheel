import type { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import type { HexColor, WheelSettings, Weight } from '@/types/wheel';

export interface WheelImportItem {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  color: HexColor;
  enabled: boolean;
  weight: Weight;
  children?: WheelImportItem[];
}

export interface WheelImportDocument {
  format: typeof WHEEL_EXPORT_FORMAT;
  version: typeof WHEEL_EXPORT_VERSION;
  id?: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  items: WheelImportItem[];
  settings: WheelSettings;
}

export type WheelImportStatus = {
  severity: 'success' | 'error';
  message: string;
};

export type WheelImportParseResult =
  | { ok: true; document: WheelImportDocument }
  | { ok: false; error: string };
