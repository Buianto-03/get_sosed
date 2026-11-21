import { createSelector } from '@reduxjs/toolkit';
import type { LikedAdvert, SavedRoot, SavedStatus } from './likedAdvertsModel';

export const selectSavedItems = (state: SavedRoot): LikedAdvert[] => state.likedAdverts.items;
export const selectSavedStatus = (state: SavedRoot): SavedStatus => state.likedAdverts.status;
export const selectSavedCollectionError = (state: SavedRoot): string | null =>
  state.likedAdverts.error;

const selectSavedIdSet = createSelector(
  (state: SavedRoot) => state.likedAdverts.savedIds,
  (ids) => new Set(ids),
);

export const selectIsSaved = (state: SavedRoot, id: number): boolean =>
  selectSavedIdSet(state).has(id);
export const selectSavePending = (state: SavedRoot, id: number): boolean =>
  !!state.likedAdverts.pending[id];
export const selectSaveError = (state: SavedRoot, id: number): string | undefined =>
  state.likedAdverts.errors[id];
