import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  SavedStatus,
  type LikedListing,
  type SavedRoot,
  type SavedState,
  type Listing,
  savedMutationStarted,
  savedListingConfirmed,
  savedRemovalConfirmed,
  savedMutationFailed,
} from '@entities/listing/model';
import { deleteLikeThunk, setLikeThunk } from '@entities/like/model/likesThunk';

const canMutate = (state: SavedState, id: number): boolean =>
  state.status === SavedStatus.Ready && !state.pending[id];

export const saveListingThunk = createAsyncThunk<LikedListing, Listing, { state: SavedRoot }>(
  'likedListings/save',
  async (listing, { dispatch, requestId }) => {
    const request = { listingId: listing.id, requestId };
    dispatch(savedMutationStarted(request));
    try {
      const like = await dispatch(setLikeThunk(listing.id)).unwrap();
      const item = { ...like, listing };
      dispatch(savedListingConfirmed({ ...request, item }));
      return item;
    } catch (error) {
      dispatch(savedMutationFailed({ ...request, error: 'Не удалось сохранить объявление.' }));
      throw error;
    }
  },
  { condition: (listing, { getState }) => canMutate(getState().likedListings, listing.id) },
);

export const removeSavedListingThunk = createAsyncThunk<number, number, { state: SavedRoot }>(
  'likedListings/remove',
  async (listingId, { dispatch, requestId }) => {
    const request = { listingId, requestId };
    dispatch(savedMutationStarted(request));
    try {
      const result = await dispatch(deleteLikeThunk(listingId)).unwrap();
      if (result.listingId !== listingId) {
        throw new Error('Unexpected listing ID');
      }
      dispatch(savedRemovalConfirmed(request));
      return result.listingId;
    } catch (error) {
      dispatch(savedMutationFailed({ ...request, error: 'Не удалось удалить объявление из избранного.' }));
      throw error;
    }
  },
  { condition: (id, { getState }) => canMutate(getState().likedListings, id) },
);
