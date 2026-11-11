/**
 * Runtime Zod schemas for persisted / exchanged domain models.
 * TypeScript compile-time types remain in `@/types/*` and feature `types.ts` files —
 * do not use `z.infer` as the source of truth for domain shapes.
 */

export {
  entityIdSchema,
  hexColorSchema,
  isoDateTimeSchema,
} from './primitives';

export { wheelItemSchema } from './wheelItem';

export {
  defaultWheelSettings,
  selectionModeSchema,
  wheelAppearanceSchema,
  wheelSettingsSchema,
  wheelSettingsStrictSchema,
} from './wheelSettings';

export {
  itemConditionSchema,
  wheelSchema,
  wheelSnapshotSchema,
} from './wheel';

export { spinResultSchema, spinSessionSchema } from './spin';

export {
  presetItemDefinitionSchema,
  wheelPresetCatalogSchema,
  wheelPresetDefinitionSchema,
  wheelPresetSchema,
} from './presets';

export { softArraySchema, softRecordSchema } from './soft';

export {
  parsePresetItemDefinition,
  parseSpinHistory,
  parseSpinResult,
  parseSpinSession,
  parseWheel,
  parseWheelItem,
  parseWheelItems,
  parseWheelPreset,
  parseWheelPresetCatalog,
  parseWheelPresetDefinition,
  parseWheelSettings,
  parseWheelSnapshot,
  parseWheels,
  type ParseFailure,
  type ParseResult,
  type ParseSuccess,
} from './parse';

/** Wire-format schemas for import / export / share (feature modules own the documents). */
export {
  importWheelNameSchema,
  importedIdSchema,
  wheelImportDocumentSchema,
  wheelImportItemSchema,
} from '@/features/wheel-import/schema';

export { wheelExportDocumentSchema, wheelExportItemSchema } from '@/features/wheel-export/schema';

export { parseShareWheel, wheelShareEnvelopeSchema } from '@/features/wheel-share/schema';
