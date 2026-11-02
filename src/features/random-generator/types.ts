import type {
  CHOICE_PRESET,
  GENERATOR_TOOL,
  MATCH_STATUS,
  NAME_STYLE,
  NUMBER_MODE,
  TOURNAMENT_ROUND,
  TOURNAMENT_STATUS,
} from '@/features/random-generator/constants';

export type GeneratorTool = (typeof GENERATOR_TOOL)[keyof typeof GENERATOR_TOOL];
export type NumberMode = (typeof NUMBER_MODE)[keyof typeof NUMBER_MODE];
export type NameStyle = (typeof NAME_STYLE)[keyof typeof NAME_STYLE];
export type ChoicePreset = (typeof CHOICE_PRESET)[keyof typeof CHOICE_PRESET];

export interface RandomListItem {
  name: string;
  weight: number;
}

export interface Team {
  name: string;
  members: string[];
}

export interface GenerateTeamsInput {
  participants: readonly string[] | string;
  teamCount: number;
  balanced: boolean;
  random: boolean;
  preventDuplicates: boolean;
}

export interface TeamGeneratorHistoryEntry {
  id: string;
  createdAt: string;
  teamCount: number;
  balanced: boolean;
  random: boolean;
  preventDuplicates: boolean;
  teams: Team[];
}

export type TournamentRoundKind = (typeof TOURNAMENT_ROUND)[keyof typeof TOURNAMENT_ROUND];
export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];
export type TournamentStatus = (typeof TOURNAMENT_STATUS)[keyof typeof TOURNAMENT_STATUS];

export interface TournamentParticipant {
  id: string;
  name: string;
}

export interface TournamentSlot {
  participantId: string | null;
}

export interface TournamentMatch {
  id: string;
  roundIndex: number;
  matchIndex: number;
  slots: [TournamentSlot, TournamentSlot];
  winnerId: string | null;
  status: MatchStatus;
}

export interface TournamentRound {
  index: number;
  kind: TournamentRoundKind;
  label: string;
  matches: TournamentMatch[];
}

export interface TournamentBracket {
  id: string;
  createdAt: string;
  status: TournamentStatus;
  participants: TournamentParticipant[];
  rounds: TournamentRound[];
  winnerId: string | null;
  eliminatedIds: string[];
}

export interface GenerateTournamentInput {
  participants: readonly string[] | string;
  random: boolean;
}

export interface GenerateTournamentOptions {
  createBracketId?: () => string;
  createParticipantId?: (index: number, name: string) => string;
  now?: () => string;
}

export type GeneratorSuccess<T> = { ok: true; value: T };
export type GeneratorFailure = { ok: false; error: string };
export type GeneratorResult<T> = GeneratorSuccess<T> | GeneratorFailure;
