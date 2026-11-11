import { DEFAULT_APP_SETTINGS } from '@/constants/settings';
import {
  MATCH_STATUS,
  TOURNAMENT_ROUND,
  TOURNAMENT_STATUS,
} from '@/features/random-generator/constants';
import type { TeamGeneratorHistoryEntry, TournamentBracket } from '@/features/random-generator/types';
import {
  softArraySchema,
  softRecordSchema,
  spinSessionSchema,
  wheelSchema,
  wheelSnapshotSchema,
} from '@/schemas';
import { storageService } from '@/services/storage/storageService';
import { COLOR_MODE, type ColorMode } from '@/types/colorMode';
import type { AppSettings } from '@/types/settings';
import {
  type SpinSession,
  type Wheel,
  type WheelId,
  type WheelSnapshot,
} from '@/types/wheel';
import { sanitizeItemTree, sanitizeWheels } from '@/utils/sanitizeWheelHierarchy';
import { z } from 'zod';

export const STORAGE_KEY = 'spinflow.persisted';
export const PERSISTED_STATE_VERSION = 1;

export interface PersistedState {
  colorMode: ColorMode;
  wheels: Wheel[];
  activeWheelId: WheelId | null;
  snapshots: Record<WheelId, WheelSnapshot>;
  spinHistory: SpinSession[];
  generatorHistory: TeamGeneratorHistoryEntry[];
  activeTournament: TournamentBracket | null;
  tournamentHistory: TournamentBracket[];
  settings: AppSettings;
  favoriteWheelIds: WheelId[];
}

export const defaultPersistedState: PersistedState = {
  colorMode: COLOR_MODE.system,
  wheels: [],
  activeWheelId: null,
  snapshots: {},
  spinHistory: [],
  generatorHistory: [],
  activeTournament: null,
  tournamentHistory: [],
  settings: { ...DEFAULT_APP_SETTINGS },
  favoriteWheelIds: [],
};

const teamSchema: z.ZodType<{ name: string; members: string[] }> = z.object({
  name: z.string(),
  members: z.array(z.string()),
});

const generatorHistoryEntrySchema: z.ZodType<TeamGeneratorHistoryEntry> = z.object({
  id: z.string(),
  createdAt: z.string(),
  teamCount: z.number(),
  balanced: z.boolean(),
  random: z.boolean(),
  preventDuplicates: z.boolean(),
  teams: z.array(teamSchema),
});

const tournamentSlotSchema = z.object({
  participantId: z.string().nullable(),
});

const tournamentMatchSchema = z.object({
  id: z.string(),
  roundIndex: z.number(),
  matchIndex: z.number(),
  slots: z.tuple([tournamentSlotSchema, tournamentSlotSchema]),
  winnerId: z.string().nullable(),
  status: z.enum([
    MATCH_STATUS.pending,
    MATCH_STATUS.ready,
    MATCH_STATUS.bye,
    MATCH_STATUS.complete,
  ]),
});

const tournamentRoundSchema = z.object({
  index: z.number(),
  kind: z.enum([
    TOURNAMENT_ROUND.quarterFinals,
    TOURNAMENT_ROUND.semiFinals,
    TOURNAMENT_ROUND.final,
    TOURNAMENT_ROUND.roundOf,
  ]),
  label: z.string(),
  matches: z.array(tournamentMatchSchema),
});

const tournamentBracketSchema: z.ZodType<TournamentBracket> = z.object({
  id: z.string(),
  createdAt: z.string(),
  status: z.enum([TOURNAMENT_STATUS.ready, TOURNAMENT_STATUS.inProgress, TOURNAMENT_STATUS.complete]),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
  rounds: z.array(tournamentRoundSchema),
  winnerId: z.string().nullable(),
  eliminatedIds: z.array(z.string()),
});

const persistedStateSchema = z.object({
  colorMode: z.enum([COLOR_MODE.light, COLOR_MODE.dark, COLOR_MODE.system]),
  wheels: softArraySchema(wheelSchema),
  activeWheelId: z.string().nullable(),
  snapshots: softRecordSchema(wheelSnapshotSchema),
  spinHistory: softArraySchema(spinSessionSchema),
  generatorHistory: softArraySchema(generatorHistoryEntrySchema)
    .optional()
    .transform((value) => value ?? []),
  activeTournament: tournamentBracketSchema
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  tournamentHistory: softArraySchema(tournamentBracketSchema)
    .optional()
    .transform((value) => value ?? []),
  settings: z.object({
    soundEnabled: z.boolean(),
    masterVolume: z.number().min(0).max(1).default(DEFAULT_APP_SETTINGS.masterVolume),
    spinSound: z.boolean().default(DEFAULT_APP_SETTINGS.spinSound),
    tickSound: z.boolean().default(DEFAULT_APP_SETTINGS.tickSound),
    winnerSound: z.boolean().default(DEFAULT_APP_SETTINGS.winnerSound),
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

export type PersistedLoadStatus = 'ok' | 'empty' | 'recovered' | 'repaired';

export interface PersistedLoadResult {
  state: PersistedState;
  status: PersistedLoadStatus;
  hierarchyRepaired: boolean;
}

function sanitizePersistedState(state: PersistedState): {
  state: PersistedState;
  hierarchyRepaired: boolean;
} {
  const wheelsResult = sanitizeWheels(state.wheels);
  const wheelIds = new Set(wheelsResult.value.map((wheel) => wheel.id));
  const activeWheelId =
    state.activeWheelId !== null && wheelIds.has(state.activeWheelId) ? state.activeWheelId : null;

  let snapshotRepaired = false;
  const snapshots = Object.fromEntries(
    Object.entries(state.snapshots)
      .filter(([wheelId]) => wheelIds.has(wheelId))
      .map(([wheelId, snapshot]) => {
        const items = sanitizeItemTree(snapshot.items);
        snapshotRepaired = snapshotRepaired || items.repaired;
        return [
          wheelId,
          {
            ...snapshot,
            items: items.value,
          },
        ];
      }),
  );

  return {
    state: {
      ...state,
      wheels: wheelsResult.value,
      activeWheelId,
      favoriteWheelIds: state.favoriteWheelIds.filter((id) => wheelIds.has(id)),
      snapshots,
    },
    hierarchyRepaired: wheelsResult.repaired || snapshotRepaired,
  };
}

export function savePersistedState(state: PersistedState): boolean {
  return storageService.writeJson(STORAGE_KEY, {
    version: PERSISTED_STATE_VERSION,
    data: state,
  });
}

export function loadPersistedStateResult(): PersistedLoadResult {
  const emptyState: PersistedState = {
    ...defaultPersistedState,
    settings: { ...DEFAULT_APP_SETTINGS },
  };

  let parsed: unknown;
  try {
    parsed = storageService.readJson<unknown>(STORAGE_KEY);
  } catch {
    return { state: emptyState, status: 'recovered', hierarchyRepaired: false };
  }

  if (parsed === null) {
    const raw = storageService.getRaw(STORAGE_KEY);
    if (raw !== null) {
      return { state: emptyState, status: 'recovered', hierarchyRepaired: false };
    }

    return { state: emptyState, status: 'empty', hierarchyRepaired: false };
  }

  const envelope = envelopeSchema.safeParse(parsed);
  if (!envelope.success) {
    return { state: emptyState, status: 'recovered', hierarchyRepaired: false };
  }

  let migrated: unknown;
  try {
    migrated =
      envelope.data.version === PERSISTED_STATE_VERSION
        ? envelope.data.data
        : applyMigrations(envelope.data.version, envelope.data.data);
  } catch {
    return { state: emptyState, status: 'recovered', hierarchyRepaired: false };
  }

  if (migrated === undefined) {
    return { state: emptyState, status: 'recovered', hierarchyRepaired: false };
  }

  const validated = persistedStateSchema.safeParse(migrated);
  if (!validated.success) {
    return { state: emptyState, status: 'recovered', hierarchyRepaired: false };
  }

  const sanitized = sanitizePersistedState(validated.data);
  return {
    state: sanitized.state,
    status: sanitized.hierarchyRepaired ? 'repaired' : 'ok',
    hierarchyRepaired: sanitized.hierarchyRepaired,
  };
}

export function loadPersistedState(): PersistedState {
  return loadPersistedStateResult().state;
}

export function clearPersistedState(): void {
  storageService.remove(STORAGE_KEY);
}
