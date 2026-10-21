import { create } from 'zustand';

import type { WheelId } from '@/types/wheel';

interface FavoritesStore {
  favoriteWheelIds: WheelId[];
  addFavorite: (wheelId: WheelId) => void;
  removeFavorite: (wheelId: WheelId) => void;
  toggleFavorite: (wheelId: WheelId) => void;
}

const initialState = {
  favoriteWheelIds: [] as WheelId[],
};

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  ...initialState,
  addFavorite: (wheelId) =>
    set((state) =>
      state.favoriteWheelIds.includes(wheelId)
        ? state
        : { favoriteWheelIds: [...state.favoriteWheelIds, wheelId] },
    ),
  removeFavorite: (wheelId) =>
    set((state) => ({
      favoriteWheelIds: state.favoriteWheelIds.filter((id) => id !== wheelId),
    })),
  toggleFavorite: (wheelId) => {
    if (get().favoriteWheelIds.includes(wheelId)) {
      get().removeFavorite(wheelId);
      return;
    }

    get().addFavorite(wheelId);
  },
}));

export function resetFavoritesStore(): void {
  useFavoritesStore.setState({ favoriteWheelIds: [] });
}
