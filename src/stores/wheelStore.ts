import { create } from 'zustand';

import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import type {
  Wheel,
  WheelDraft,
  WheelId,
  WheelItem,
  WheelItemId,
  WheelSettings,
  WheelSnapshot,
} from '@/types/wheel';
import { createId, nowIso } from '@/utils/id';
import {
  addChildToTree,
  cloneItemTree,
  cloneItemsPreserveIds,
  duplicateItemInTree,
  findItem,
  mapItemTree,
  materializeItem,
  patchItem,
  removeItemFromTree,
  reorderSiblings,
  type NewWheelItemInput,
  type WheelItemPatch,
} from '@/utils/wheelTree';

export type CreateWheelInput = Omit<WheelDraft, 'items' | 'settings'> & {
  id?: WheelId;
  items?: NewWheelItemInput[];
  settings?: Partial<WheelSettings>;
};

export type WheelPatch = Partial<Pick<Wheel, 'name' | 'description' | 'category' | 'conditions'>>;

interface WheelStoreState {
  wheels: Wheel[];
  activeWheelId: WheelId | null;
  snapshots: Record<WheelId, WheelSnapshot>;
}

interface WheelStoreActions {
  createWheel: (input: CreateWheelInput) => Wheel;
  updateWheel: (wheelId: WheelId, patch: WheelPatch) => Wheel | undefined;
  deleteWheel: (wheelId: WheelId) => void;
  duplicateWheel: (wheelId: WheelId) => Wheel | undefined;
  getWheel: (wheelId: WheelId) => Wheel | undefined;
  setActiveWheel: (wheelId: WheelId | null) => void;
  addItem: (wheelId: WheelId, item: NewWheelItemInput) => WheelItem | undefined;
  updateItem: (
    wheelId: WheelId,
    itemId: WheelItemId,
    patch: WheelItemPatch,
  ) => WheelItem | undefined;
  deleteItem: (wheelId: WheelId, itemId: WheelItemId) => void;
  duplicateItem: (wheelId: WheelId, itemId: WheelItemId) => WheelItem | undefined;
  addChildItem: (
    parentId: WheelId | WheelItemId,
    child: NewWheelItemInput,
  ) => WheelItem | undefined;
  updateChildItem: (itemId: WheelItemId, patch: WheelItemPatch) => WheelItem | undefined;
  deleteChildItem: (itemId: WheelItemId) => void;
  reorderItems: (
    wheelId: WheelId,
    parentItemId: WheelItemId | null,
    orderedIds: WheelItemId[],
  ) => void;
  toggleItem: (wheelId: WheelId, itemId: WheelItemId) => WheelItem | undefined;
  updateWheelSettings: (
    wheelId: WheelId,
    settings: Partial<WheelSettings>,
  ) => WheelSettings | undefined;
  resetWheel: (wheelId: WheelId) => Wheel | undefined;
}

export type WheelStore = WheelStoreState & WheelStoreActions;

const initialState: WheelStoreState = {
  wheels: [],
  activeWheelId: null,
  snapshots: {},
};

function createSnapshot(wheel: Wheel): WheelSnapshot {
  return {
    items: cloneItemsPreserveIds(wheel.items),
    settings: { ...wheel.settings },
    conditions: wheel.conditions ? [...wheel.conditions] : undefined,
  };
}

function replaceWheel(
  wheels: Wheel[],
  wheelId: WheelId,
  updater: (wheel: Wheel) => Wheel,
): Wheel[] {
  let found = false;
  const nextWheels = wheels.map((wheel) => {
    if (wheel.id !== wheelId) {
      return wheel;
    }

    found = true;
    return updater(wheel);
  });

  return found ? nextWheels : wheels;
}

function findWheelByItemId(wheels: Wheel[], itemId: WheelItemId): Wheel | undefined {
  return wheels.find((wheel) => Boolean(findItem(wheel.items, itemId)));
}

export const useWheelStore = create<WheelStore>((set, get) => ({
  ...initialState,

  createWheel: (input) => {
    const timestamp = nowIso();
    const wheel: Wheel = {
      id: input.id ?? createId(),
      name: input.name,
      description: input.description,
      category: input.category,
      items: (input.items ?? []).map(materializeItem),
      settings: {
        ...DEFAULT_WHEEL_SETTINGS,
        ...input.settings,
      },
      conditions: input.conditions,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    set((state) => ({
      wheels: [...state.wheels, wheel],
      snapshots: {
        ...state.snapshots,
        [wheel.id]: createSnapshot(wheel),
      },
    }));

    return wheel;
  },

  updateWheel: (wheelId, patch) => {
    let updated: Wheel | undefined;

    set((state) => ({
      wheels: replaceWheel(state.wheels, wheelId, (wheel) => {
        updated = {
          ...wheel,
          ...patch,
          id: wheel.id,
          createdAt: wheel.createdAt,
          updatedAt: nowIso(),
        };
        return updated;
      }),
    }));

    return updated;
  },

  deleteWheel: (wheelId) => {
    set((state) => {
      const { [wheelId]: _removed, ...snapshots } = state.snapshots;

      return {
        wheels: state.wheels.filter((wheel) => wheel.id !== wheelId),
        snapshots,
        activeWheelId: state.activeWheelId === wheelId ? null : state.activeWheelId,
      };
    });
  },

  duplicateWheel: (wheelId) => {
    const source = get().getWheel(wheelId);
    if (!source) {
      return undefined;
    }

    const timestamp = nowIso();
    const wheel: Wheel = {
      ...source,
      id: createId(),
      name: `${source.name} copy`,
      items: source.items.map(cloneItemTree),
      settings: { ...source.settings },
      conditions: source.conditions ? [...source.conditions] : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    set((state) => ({
      wheels: [...state.wheels, wheel],
      snapshots: {
        ...state.snapshots,
        [wheel.id]: createSnapshot(wheel),
      },
    }));

    return wheel;
  },

  getWheel: (wheelId) => get().wheels.find((wheel) => wheel.id === wheelId),

  setActiveWheel: (wheelId) => {
    if (wheelId !== null && !get().getWheel(wheelId)) {
      return;
    }

    set({ activeWheelId: wheelId });
  },

  addItem: (wheelId, item) => {
    const created = materializeItem(item);
    let added = false;

    set((state) => ({
      wheels: replaceWheel(state.wheels, wheelId, (wheel) => {
        added = true;
        return {
          ...wheel,
          items: [...wheel.items, created],
          updatedAt: nowIso(),
        };
      }),
    }));

    return added ? created : undefined;
  },

  updateItem: (wheelId, itemId, patch) => {
    let updatedItem: WheelItem | undefined;

    set((state) => ({
      wheels: replaceWheel(state.wheels, wheelId, (wheel) => {
        const items = mapItemTree(wheel.items, itemId, (item) => {
          updatedItem = patchItem(item, patch);
          return updatedItem;
        });

        if (items === wheel.items) {
          return wheel;
        }

        return {
          ...wheel,
          items,
          updatedAt: nowIso(),
        };
      }),
    }));

    return updatedItem;
  },

  deleteItem: (wheelId, itemId) => {
    set((state) => ({
      wheels: replaceWheel(state.wheels, wheelId, (wheel) => {
        const items = removeItemFromTree(wheel.items, itemId);
        if (items === wheel.items) {
          return wheel;
        }

        return {
          ...wheel,
          items,
          updatedAt: nowIso(),
        };
      }),
    }));
  },

  duplicateItem: (wheelId, itemId) => {
    let copy: WheelItem | undefined;

    set((state) => ({
      wheels: replaceWheel(state.wheels, wheelId, (wheel) => {
        const result = duplicateItemInTree(wheel.items, itemId);
        copy = result.copy;
        if (!result.copy) {
          return wheel;
        }

        return {
          ...wheel,
          items: result.items,
          updatedAt: nowIso(),
        };
      }),
    }));

    return copy;
  },

  addChildItem: (parentId, child) => {
    const created = materializeItem(child);
    const parentWheel = get().getWheel(parentId);

    if (parentWheel) {
      set((state) => ({
        wheels: replaceWheel(state.wheels, parentId, (wheel) => ({
          ...wheel,
          items: [...wheel.items, created],
          updatedAt: nowIso(),
        })),
      }));

      return created;
    }

    let added = false;

    set((state) => ({
      wheels: state.wheels.map((wheel) => {
        const items = addChildToTree(wheel.items, parentId, created);
        if (items === wheel.items) {
          return wheel;
        }

        added = true;
        return {
          ...wheel,
          items,
          updatedAt: nowIso(),
        };
      }),
    }));

    return added ? created : undefined;
  },

  updateChildItem: (itemId, patch) => {
    const wheel = findWheelByItemId(get().wheels, itemId);
    if (!wheel) {
      return undefined;
    }

    return get().updateItem(wheel.id, itemId, patch);
  },

  deleteChildItem: (itemId) => {
    const wheel = findWheelByItemId(get().wheels, itemId);
    if (!wheel) {
      return;
    }

    get().deleteItem(wheel.id, itemId);
  },

  reorderItems: (wheelId, parentItemId, orderedIds) => {
    set((state) => ({
      wheels: replaceWheel(state.wheels, wheelId, (wheel) => {
        const items = reorderSiblings(wheel.items, parentItemId, orderedIds);
        if (items === wheel.items) {
          return wheel;
        }

        return {
          ...wheel,
          items,
          updatedAt: nowIso(),
        };
      }),
    }));
  },

  toggleItem: (wheelId, itemId) => {
    let toggled: WheelItem | undefined;

    set((state) => ({
      wheels: replaceWheel(state.wheels, wheelId, (wheel) => {
        const items = mapItemTree(wheel.items, itemId, (item) => {
          toggled = patchItem(item, { enabled: !item.enabled });
          return toggled;
        });

        if (items === wheel.items) {
          return wheel;
        }

        return {
          ...wheel,
          items,
          updatedAt: nowIso(),
        };
      }),
    }));

    return toggled;
  },

  updateWheelSettings: (wheelId, settings) => {
    let nextSettings: WheelSettings | undefined;

    set((state) => ({
      wheels: replaceWheel(state.wheels, wheelId, (wheel) => {
        nextSettings = {
          ...wheel.settings,
          ...settings,
        };

        return {
          ...wheel,
          settings: nextSettings,
          updatedAt: nowIso(),
        };
      }),
    }));

    return nextSettings;
  },

  resetWheel: (wheelId) => {
    const snapshot = get().snapshots[wheelId];
    if (!snapshot) {
      return undefined;
    }

    let reset: Wheel | undefined;

    set((state) => ({
      wheels: replaceWheel(state.wheels, wheelId, (wheel) => {
        reset = {
          ...wheel,
          items: cloneItemsPreserveIds(snapshot.items),
          settings: { ...snapshot.settings },
          conditions: snapshot.conditions ? [...snapshot.conditions] : undefined,
          updatedAt: nowIso(),
        };
        return reset;
      }),
    }));

    return reset;
  },
}));

export function resetWheelStore(): void {
  useWheelStore.setState({ ...initialState, snapshots: {} });
}
