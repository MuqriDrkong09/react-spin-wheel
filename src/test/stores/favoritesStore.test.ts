import { resetFavoritesStore, useFavoritesStore } from '@/stores/favoritesStore';

describe('useFavoritesStore', () => {
  beforeEach(() => {
    resetFavoritesStore();
  });

  it('starts with no favorites', () => {
    expect(useFavoritesStore.getState().favoriteWheelIds).toEqual([]);
  });

  it('adds a favorite once and ignores duplicates', () => {
    useFavoritesStore.getState().addFavorite('pizza');
    useFavoritesStore.getState().addFavorite('pizza');
    useFavoritesStore.getState().addFavorite('chores');

    expect(useFavoritesStore.getState().favoriteWheelIds).toEqual(['pizza', 'chores']);
  });

  it('removes a favorite', () => {
    useFavoritesStore.getState().addFavorite('pizza');
    useFavoritesStore.getState().addFavorite('chores');
    useFavoritesStore.getState().removeFavorite('pizza');

    expect(useFavoritesStore.getState().favoriteWheelIds).toEqual(['chores']);
  });

  it('toggles a favorite on and off', () => {
    useFavoritesStore.getState().toggleFavorite('pizza');
    expect(useFavoritesStore.getState().favoriteWheelIds).toEqual(['pizza']);

    useFavoritesStore.getState().toggleFavorite('pizza');
    expect(useFavoritesStore.getState().favoriteWheelIds).toEqual([]);
  });
});
