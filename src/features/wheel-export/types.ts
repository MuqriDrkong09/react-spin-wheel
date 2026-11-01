import type { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import type { HexColor, WheelSettings, Weight } from '@/types/wheel';

export interface WheelExportItem {
  name: string;
  description?: string;
  icon?: string;
  color: HexColor;
  enabled: boolean;
  weight: Weight;
  children?: WheelExportItem[];
}

export interface WheelExportDocument {
  format: typeof WHEEL_EXPORT_FORMAT;
  version: typeof WHEEL_EXPORT_VERSION;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  items: WheelExportItem[];
  settings: WheelSettings;
}

export type WheelExportStatus = {
  severity: 'success' | 'error';
  message: string;
};

export type WheelExportResult =
  | { ok: true; filename: string; json: string; document: WheelExportDocument }
  | { ok: false; error: string };
