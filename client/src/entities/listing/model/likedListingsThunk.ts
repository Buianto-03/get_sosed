import { createAsyncThunk } from '@reduxjs/toolkit';
import { listingService } from '../api/listingService';
import { SavedStatus, type LikedListing, type SavedRoot } from './likedListingsModel';

export const getLikedListingsThunk = createAsyncThunk<LikedListing[], void, { state: SavedRoot }>(
  'likedListings/get',
  (_, { signal }) => listingService.getLikedListings({ signal }),
  {
    condition: (_, { getState }) => {
      const state = getState().likedListings;
      return state.status !== SavedStatus.Loading && Object.keys(state.pending).length === 0;
    },
  },
);
