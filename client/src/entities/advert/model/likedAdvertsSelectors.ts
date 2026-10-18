import type { SavedRoot, SavedState } from './likedAdvertsModel';

export const selectSavedAdverts = (state: SavedRoot): SavedState => state.likedAdverts;
export const selectIsSaved = (state: SavedRoot, id: number): boolean =>
  state.likedAdverts.savedIds.includes(id);
export const selectSavePending = (state: SavedRoot, id: number): boolean =>
  !!state.likedAdverts.pending[id];
