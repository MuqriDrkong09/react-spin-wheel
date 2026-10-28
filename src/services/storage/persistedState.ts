import { DEFAULT_APP_SETTINGS } from '@/constants/settings';
import {
  isAppearanceInput,
  resolveAppearance,
} from '@/features/wheel-customization/utils/appearance';
import { COLOR_MODE, type ColorMode } from '@/types/colorMode';
import type { AppSettings } from '@/types/settings';
import {
  ITEM_CONDITION_KIND,
  SELECTION_MODE,
  SPIN_SESSION_STATUS,
  type HexColor,
  type ItemCondition,
  type SpinResult,
  type SpinSession,
  type Wheel,
  type WheelId,
  type WheelItem,
  type WheelSettings,
  type WheelSnapshot,
} from '@/types/wheel';
import { z } from 'zod';

import { storageService } from './storageService';

export const STORAGE_KEY = 'spinflow.persisted';
export const PERSISTED_STATE_VERSION = 1;

export interface PersistedState {
  colorMode: ColorMode;
  wheels: Wheel[];
  activeWheelId: WheelId | null;
  snapshots: Record<WheelId, WheelSnapshot>;
  spinHistory: SpinSession[];
  settings: AppSettings;
  favoriteWheelIds: WheelId[];
}

export const defaultPersistedState: PersistedState = {
  colorMode: COLOR_MODE.system,
  wheels: [],
  activeWheelId: null,
  snapshots: {},
  spinHistory: [],
  settings: { ...DEFAULT_APP_SETTINGS },
  favoriteWheelIds: [],
};

const hexColorSchema = z.custom<HexColor>(
  (value) => typeof value === 'string' && value.startsWith('#'),
);

const wheelSettingsSchema = z.object({
  durationMs: z.number(),
  minRotations: z.number(),
  maxRotations: z.number(),
  soundEnabled: z.boolean(),
  confettiEnabled: z.boolean(),
  eliminationMode: z.boolean(),
  selectionMode: z
    .enum([SELECTION_MODE.manual, SELECTION_MODE.automatic, SELECTION_MODE.ask])
    .default(SELECTION_MODE.manual),
  removeWinner: z.boolean().default(false),
  skipDisabledItems: z.boolean(),
  appearance: z
    .unknown()
    .optional()
    .transform((value) => resolveAppearance(isAppearanceInput(value) ? value : undefined)),
}) satisfies z.ZodType<WheelSettings>;

const itemConditionSchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string(),
    itemId: z.string(),
    kind: z.literal(ITEM_CONDITION_KIND.always),
  }),
  z.object({
    id: z.string(),
    itemId: z.string(),
    kind: z.literal(ITEM_CONDITION_KIND.requiresSelectedItem),
    requiredItemId: z.string(),
  }),
  z.object({
    id: z.string(),
    itemId: z.string(),
    kind: z.literal(ITEM_CONDITION_KIND.maxWins),
    limit: z.number(),
  }),
  z.object({
    id: z.string(),
    itemId: z.string(),
    kind: z.literal(ITEM_CONDITION_KIND.minWeight),
    minWeight: z.number(),
  }),
]) satisfies z.ZodType<ItemCondition>;

const wheelItemSchema: z.ZodType<WheelItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: hexColorSchema,
    enabled: z.boolean(),
    weight: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    children: z.array(wheelItemSchema).optional(),
  }),
);

const wheelSchema: z.ZodType<Wheel> = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  items: z.array(wheelItemSchema),
  settings: wheelSettingsSchema,
  conditions: z.array(itemConditionSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const snapshotSchema: z.ZodType<WheelSnapshot> = z.object({
  items: z.array(wheelItemSchema),
  settings: wheelSettingsSchema,
  conditions: z.array(itemConditionSchema).optional(),
});

const spinResultSchema: z.ZodType<SpinResult> = z
  .object({
    id: z.string(),
    sessionId: z.string(),
    wheelId: z.string(),
    itemId: z.string(),
    itemName: z.string(),
    selectedItemId: z.string().optional(),
    selectedItemName: z.string().optional(),
    parentItemId: z.string().nullable(),
    path: z.array(z.string()),
    pathLabels: z.array(z.string()).optional(),
    depth: z.number(),
    probability: z.number(),
    timestamp: z.string().optional(),
    spunAt: z.string(),
    duration: z.number().optional(),
    mode: z
      .enum([SELECTION_MODE.manual, SELECTION_MODE.automatic, SELECTION_MODE.ask])
      .optional(),
  })
  .transform((value) => ({
    ...value,
    selectedItemId: value.selectedItemId ?? value.itemId,
    selectedItemName: value.selectedItemName ?? value.itemName,
    pathLabels: value.pathLabels ?? [value.itemName],
    timestamp: value.timestamp ?? value.spunAt,
    duration: value.duration ?? 0,
    mode: value.mode ?? SELECTION_MODE.manual,
  }));

const spinSessionSchema: z.ZodType<SpinSession> = z.object({
  id: z.string(),
  wheelId: z.string(),
  wheelName: z.string(),
  status: z.enum([
    SPIN_SESSION_STATUS.inProgress,
    SPIN_SESSION_STATUS.completed,
    SPIN_SESSION_STATUS.cancelled,
  ]),
  results: z.array(spinResultSchema),
  path: z.array(z.string()),
  startedAt: z.string(),
  completedAt: z.string().optional(),
});

const persistedStateSchema: z.ZodType<PersistedState> = z.object({
  colorMode: z.enum([COLOR_MODE.light, COLOR_MODE.dark, COLOR_MODE.system]),
  wheels: z.array(wheelSchema),
  activeWheelId: z.string().nullable(),
  snapshots: z.record(z.string(), snapshotSchema),
  spinHistory: z.array(spinSessionSchema),
  settings: z.object({
    soundEnabled: z.boolean(),
    confettiEnabled: z.boolean(),
    confirmBeforeDelete: z.boolean(),
  }),
  favoriteWheelIds: z.array(z.string()),
});

const envelopeSchema = z.object({
  version: z.number().int().nonnegative(),
  data: z.unknown(),
});

export const migrations: Record<number, (data: unknown) => unknown> = {
  0: (data) => {
    const source = isRecord(data) ? data : {};
    const settings = isRecord(source.settings) ? source.settings : {};

    return {
      ...defaultPersistedState,
      ...source,
      settings: {
        ...DEFAULT_APP_SETTINGS,
        ...settings,
      },
    };
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function applyMigrations(version: number, data: unknown): unknown {
  let currentVersion = version;
  let currentData = data;

  while (currentVersion < PERSISTED_STATE_VERSION) {
    const migrate = migrations[currentVersion];
    if (!migrate) {
      return undefined;
    }

    currentData = migrate(currentData);
    currentVersion += 1;
  }

  return currentData;
}

function sanitizePersistedState(state: PersistedState): PersistedState {
  const wheelIds = new Set(state.wheels.map((wheel) => wheel.id));
  const activeWheelId =
    state.activeWheelId !== null && wheelIds.has(state.activeWheelId) ? state.activeWheelId : null;

  return {
    ...state,
    activeWheelId,
    favoriteWheelIds: state.favoriteWheelIds.filter((id) => wheelIds.has(id)),
    snapshots: Object.fromEntries(
      Object.entries(state.snapshots).filter(([wheelId]) => wheelIds.has(wheelId)),
    ),
  };
}

export function savePersistedState(state: PersistedState): boolean {
  return storageService.writeJson(STORAGE_KEY, {
    version: PERSISTED_STATE_VERSION,
    data: state,
  });
}

export function loadPersistedState(): PersistedState {
  const parsed = storageService.readJson<unknown>(STORAGE_KEY);

  if (parsed === null) {
    return {
      ...defaultPersistedState,
      settings: { ...DEFAULT_APP_SETTINGS },
    };
  }

  const envelope = envelopeSchema.safeParse(parsed);
  if (!envelope.success) {
    return defaultPersistedState;
  }

  const migrated =
    envelope.data.version === PERSISTED_STATE_VERSION
      ? envelope.data.data
      : applyMigrations(envelope.data.version, envelope.data.data);

  const validated = persistedStateSchema.safeParse(migrated);
  if (!validated.success) {
    return defaultPersistedState;
  }

  return sanitizePersistedState(validated.data);
}

export function clearPersistedState(): void {
  storageService.remove(STORAGE_KEY);
}
