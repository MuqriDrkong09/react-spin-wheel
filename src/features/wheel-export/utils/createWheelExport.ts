import { EXPORT_MESSAGES } from '@/features/wheel-export/constants';
import { wheelExportDocumentSchema } from '@/features/wheel-export/schema';
import type { WheelExportResult } from '@/features/wheel-export/types';
import { toWheelExportDocument } from '@/features/wheel-export/utils/toWheelExport';
import { toWheelExportFilename } from '@/features/wheel-export/utils/wheelExportFilename';
import type { Wheel } from '@/types/wheel';

export function createWheelExport(wheel: Wheel): WheelExportResult {
  const parsed = wheelExportDocumentSchema.safeParse(toWheelExportDocument(wheel));
  if (!parsed.success) {
    return {
      ok: false,
      error: exportValidationMessage(parsed.error.issues),
    };
  }

  return {
    ok: true,
    filename: toWheelExportFilename(parsed.data.name),
    json: `${JSON.stringify(parsed.data, null, 2)}\n`,
    document: parsed.data,
  };
}

function exportValidationMessage(issues: readonly { path: PropertyKey[] }[]): string {
  const path = issues[0]?.path.map(String).join('.') ?? '';

  if (path === 'name') {
    return EXPORT_MESSAGES.nameRequired;
  }

  if (path.endsWith('.name')) {
    return EXPORT_MESSAGES.itemNameRequired;
  }

  if (path === 'items' || path.endsWith('.items')) {
    return EXPORT_MESSAGES.itemsRequired;
  }

  if (path.includes('color')) {
    return EXPORT_MESSAGES.invalidColor;
  }

  if (path.includes('weight')) {
    return EXPORT_MESSAGES.invalidWeight;
  }

  if (path.includes('settings') || path.includes('appearance')) {
    return EXPORT_MESSAGES.invalidSettings;
  }

  return EXPORT_MESSAGES.invalid;
}
