import { IMPORT_MESSAGES, MAX_IMPORT_BYTES } from '@/features/wheel-import/constants';
import { wheelImportDocumentSchema } from '@/features/wheel-import/schema';
import type { WheelImportParseResult } from '@/features/wheel-import/types';

export function parseImportedWheelJson(raw: string): WheelImportParseResult {
  const text = raw.replace(/^\uFEFF/, '').trim();
  if (text.length === 0) {
    return { ok: false, error: IMPORT_MESSAGES.empty };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: IMPORT_MESSAGES.malformed };
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: IMPORT_MESSAGES.notWheel };
  }

  const result = wheelImportDocumentSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, error: importValidationMessage(result.error.issues) };
  }

  return { ok: true, document: result.data };
}

export async function parseImportedWheelFile(file: File): Promise<WheelImportParseResult> {
  if (file.size === 0) {
    return { ok: false, error: IMPORT_MESSAGES.empty };
  }

  if (file.size > MAX_IMPORT_BYTES) {
    return { ok: false, error: IMPORT_MESSAGES.tooLarge };
  }

  try {
    return parseImportedWheelJson(await file.text());
  } catch {
    return { ok: false, error: IMPORT_MESSAGES.malformed };
  }
}

function importValidationMessage(issues: readonly { path: PropertyKey[] }[]): string {
  const path = issues[0]?.path.map(String).join('.') ?? '';

  if (path === 'format' || path === 'version') {
    return IMPORT_MESSAGES.notWheel;
  }

  if (path === 'name') {
    return IMPORT_MESSAGES.nameRequired;
  }

  if (path.endsWith('.name')) {
    return IMPORT_MESSAGES.itemNameRequired;
  }

  if (path === 'items') {
    return IMPORT_MESSAGES.itemsRequired;
  }

  if (path === 'id' || path.endsWith('.id')) {
    return IMPORT_MESSAGES.invalidId;
  }

  if (path.includes('color')) {
    return IMPORT_MESSAGES.invalidColor;
  }

  if (path.includes('weight')) {
    return IMPORT_MESSAGES.invalidWeight;
  }

  if (path.includes('children')) {
    return IMPORT_MESSAGES.invalidChildren;
  }

  if (path.includes('settings') || path.includes('appearance')) {
    return IMPORT_MESSAGES.invalidSettings;
  }

  return IMPORT_MESSAGES.invalid;
}
