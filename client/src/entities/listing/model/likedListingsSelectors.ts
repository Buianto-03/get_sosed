import { createSelector } from '@reduxjs/toolkit';
import type { LikedListing, SavedRoot, SavedStatus } from './likedListingsModel';

export const selectSavedItems = (state: SavedRoot): LikedListing[] => state.likedListings.items;
export const selectSavedStatus = (state: SavedRoot): SavedStatus => state.likedListings.status;
export const selectSavedCollectionError = (state: SavedRoot): string | null =>
  state.likedListings.error;

const selectSavedIdSet = createSelector(
  (state: SavedRoot) => state.likedListings.savedIds,
  (ids) => new Set(ids),
);

export const selectIsSaved = (state: SavedRoot, id: number): boolean =>
  selectSavedIdSet(state).has(id);
export const selectSavePending = (state: SavedRoot, id: number): boolean =>
  !!state.likedListings.pending[id];
export const selectSaveError = (state: SavedRoot, id: number): string | undefined =>
  state.likedListings.errors[id];
