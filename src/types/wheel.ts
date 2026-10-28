export type EntityId = string;
export type IsoDateTime = string;
export type HexColor = `#${string}`;
export type Probability = number;
export type Weight = number;

export type WheelId = EntityId;
export type WheelItemId = EntityId;
export type SpinResultId = EntityId;
export type SpinSessionId = EntityId;
export type WheelPresetId = EntityId;
export type ItemConditionId = EntityId;

export type WheelItemPath = readonly WheelItemId[];

export interface Identifiable<TId extends EntityId = EntityId> {
  id: TId;
}

export interface Timestamps {
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export type Draft<T extends Identifiable & Timestamps> = Omit<T, 'id' | keyof Timestamps>;
export type Patch<T extends Identifiable> = Partial<Omit<T, 'id'>>;

export const SPIN_SESSION_STATUS = {
  inProgress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export type SpinSessionStatus = (typeof SPIN_SESSION_STATUS)[keyof typeof SPIN_SESSION_STATUS];

export const ITEM_CONDITION_KIND = {
  always: 'always',
  requiresSelectedItem: 'requires_selected_item',
  maxWins: 'max_wins',
  minWeight: 'min_weight',
} as const;

export type ItemConditionKind = (typeof ITEM_CONDITION_KIND)[keyof typeof ITEM_CONDITION_KIND];

interface ItemConditionBase extends Identifiable<ItemConditionId> {
  itemId: WheelItemId;
}

export type ItemCondition =
  | (ItemConditionBase & {
      kind: typeof ITEM_CONDITION_KIND.always;
    })
  | (ItemConditionBase & {
      kind: typeof ITEM_CONDITION_KIND.requiresSelectedItem;
      requiredItemId: WheelItemId;
    })
  | (ItemConditionBase & {
      kind: typeof ITEM_CONDITION_KIND.maxWins;
      limit: number;
    })
  | (ItemConditionBase & {
      kind: typeof ITEM_CONDITION_KIND.minWeight;
      minWeight: Weight;
    });

export interface WheelItem extends Identifiable<WheelItemId>, Timestamps {
  name: string;
  description?: string;
  icon?: string;
  color: HexColor;
  enabled: boolean;
  weight: Weight;
  children?: WheelItem[];
}

export type WheelItemDraft = Omit<WheelItem, 'id' | keyof Timestamps | 'children'> & {
  children?: WheelItemDraft[];
};

export type WheelItemLeaf = Omit<WheelItem, 'children'> & {
  children?: undefined;
};

export type WheelItemBranch = WheelItem & {
  children: WheelItem[];
};

export type FlattenedWheelItem = Omit<WheelItem, 'children'> & {
  parentId: WheelItemId | null;
  depth: number;
  path: WheelItemPath;
  hasChildren: boolean;
};

export const SELECTION_MODE = {
  manual: 'manual',
  automatic: 'automatic',
  ask: 'ask',
} as const;

export type SelectionMode = (typeof SELECTION_MODE)[keyof typeof SELECTION_MODE];

export function isSelectionMode(value: string): value is SelectionMode {
  return (
    value === SELECTION_MODE.manual ||
    value === SELECTION_MODE.automatic ||
    value === SELECTION_MODE.ask
  );
}

export const WHEEL_THEME = {
  classic: 'classic',
  neon: 'neon',
  pastel: 'pastel',
  minimal: 'minimal',
  dark: 'dark',
  rainbow: 'rainbow',
  custom: 'custom',
} as const;

export type WheelTheme = (typeof WHEEL_THEME)[keyof typeof WHEEL_THEME];

export const WHEEL_SIZE = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
} as const;

export type WheelSize = (typeof WHEEL_SIZE)[keyof typeof WHEEL_SIZE];

export const CENTER_BUTTON_STYLE = {
  filled: 'filled',
  outlined: 'outlined',
  ghost: 'ghost',
} as const;

export type CenterButtonStyle = (typeof CENTER_BUTTON_STYLE)[keyof typeof CENTER_BUTTON_STYLE];

export type WheelFontWeight = 400 | 600 | 700;

export interface WheelAppearance {
  title: string;
  size: WheelSize;
  theme: WheelTheme;
  segmentColors: HexColor[];
  textColor: HexColor;
  pointerColor: HexColor;
  borderWidth: number;
  borderColor: HexColor;
  fontSize: number;
  fontWeight: WheelFontWeight;
  background: HexColor;
  centerButtonStyle: CenterButtonStyle;
  centerButtonColor: HexColor;
  centerButtonTextColor: HexColor;
}

export interface WheelSettings {
  durationMs: number;
  minRotations: number;
  maxRotations: number;
  soundEnabled: boolean;
  confettiEnabled: boolean;
  eliminationMode: boolean;
  selectionMode: SelectionMode;
  removeWinner: boolean;
  skipDisabledItems: boolean;
  appearance: WheelAppearance;
}

export interface Wheel extends Identifiable<WheelId>, Timestamps {
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  items: WheelItem[];
  settings: WheelSettings;
  conditions?: ItemCondition[];
}

export interface WheelSnapshot {
  items: WheelItem[];
  settings: WheelSettings;
  conditions?: Wheel['conditions'];
}

export type WheelDraft = Draft<Wheel>;

export interface WheelPreset extends Identifiable<WheelPresetId>, Timestamps {
  name: string;
  description?: string;
  items: WheelItem[];
  settings: WheelSettings;
  sourceWheelId?: WheelId;
}

export type WheelPresetDraft = Draft<WheelPreset>;

export interface ItemProbability {
  itemId: WheelItemId;
  parentId: WheelItemId | null;
  weight: Weight;
  probability: Probability;
}

export interface SpinResult extends Identifiable<SpinResultId> {
  sessionId: SpinSessionId;
  wheelId: WheelId;
  itemId: WheelItemId;
  itemName: string;
  selectedItemId: WheelItemId;
  selectedItemName: string;
  parentItemId: WheelItemId | null;
  path: WheelItemPath;
  pathLabels: string[];
  depth: number;
  probability: Probability;
  timestamp: IsoDateTime;
  spunAt: IsoDateTime;
  duration: number;
  mode: SelectionMode;
}

export interface SpinSession extends Identifiable<SpinSessionId> {
  wheelId: WheelId;
  wheelName: string;
  status: SpinSessionStatus;
  results: SpinResult[];
  path: WheelItemPath;
  startedAt: IsoDateTime;
  completedAt?: IsoDateTime;
}

export interface ItemSelectionStat {
  itemId: WheelItemId;
  path: WheelItemPath;
  selectionCount: number;
  selectionRate: Probability;
}

export interface WheelStatistics {
  wheelId: WheelId;
  sessionCount: number;
  spinCount: number;
  items: ItemSelectionStat[];
  probabilities: ItemProbability[];
  mostSelectedItemId?: WheelItemId;
  lastSessionAt?: IsoDateTime;
}

export function isWheelItemBranch(item: WheelItem): item is WheelItemBranch {
  return Array.isArray(item.children) && item.children.length > 0;
}

export function isWheelItemLeaf(item: WheelItem): item is WheelItemLeaf {
  return !isWheelItemBranch(item);
}
