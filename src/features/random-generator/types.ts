import type {
  CHOICE_PRESET,
  GENERATOR_TOOL,
  NAME_STYLE,
  NUMBER_MODE,
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

export type GeneratorSuccess<T> = { ok: true; value: T };
export type GeneratorFailure = { ok: false; error: string };
export type GeneratorResult<T> = GeneratorSuccess<T> | GeneratorFailure;
