import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { isRequestCanceled } from '@shared/api/cancellation';
import {
  SavedStatus,
  type SavedState,
  type SaveRequest,
  type SaveSuccess,
  type SaveFailure,
} from './likedListingsModel';
import { getLikedListingsThunk } from './likedListingsThunk';

const initialState: SavedState = {
  items: [],
  savedIds: [],
  status: SavedStatus.Idle,
  initialized: false,
  error: null,
  pending: {},
  errors: {},
  requestId: null,
};

const likedListingsSlice = createSlice({
  name: 'likedListings',
  initialState,
  reducers: {
    resetSavedListings: () => initialState,
    savedLoadRequested: (state) => state,
    savedMutationStarted: (state, { payload }: PayloadAction<SaveRequest>) => {
      state.pending[payload.listingId] = payload.requestId;
      delete state.errors[payload.listingId];
    },
    savedListingConfirmed: (state, { payload }: PayloadAction<SaveSuccess>) => {
      const { listingId, requestId, item } = payload;
      if (state.pending[listingId] !== requestId) {
        return;
      }
      state.items = state.items.filter((entry) => entry.advertId !== listingId);
      state.items.push(item);
      if (!state.savedIds.includes(listingId)) {
        state.savedIds.push(listingId);
      }
      delete state.pending[listingId];
    },
    savedRemovalConfirmed: (state, { payload }: PayloadAction<SaveRequest>) => {
      const { listingId, requestId } = payload;
      if (state.pending[listingId] !== requestId) {
        return;
      }
      state.items = state.items.filter((item) => item.advertId !== listingId);
      state.savedIds = state.savedIds.filter((id) => id !== listingId);
      delete state.pending[listingId];
    },
    savedMutationFailed: (state, { payload }: PayloadAction<SaveFailure>) => {
      const { listingId, requestId, error } = payload;
      if (state.pending[listingId] !== requestId) {
        return;
      }
      delete state.pending[listingId];
      state.errors[listingId] = error;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLikedListingsThunk.pending, (state, action) => {
        state.status = SavedStatus.Loading;
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(getLikedListingsThunk.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) {
          return;
        }
        state.items = action.payload;
        state.savedIds = [...new Set(action.payload.map((item) => item.advertId))];
        state.status = SavedStatus.Ready;
        state.initialized = true;
        state.requestId = null;
      })
      .addCase(getLikedListingsThunk.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) {
          return;
        }
        const canceled = action.meta.aborted || isRequestCanceled(action.error);
        if (canceled) {
          state.status = state.initialized ? SavedStatus.Ready : SavedStatus.Idle;
          state.error = null;
        } else {
          state.status = SavedStatus.Error;
          state.error = 'Не удалось загрузить избранное.';
        }
        state.requestId = null;
      });
  },
});
export const {
  resetSavedListings,
  savedLoadRequested,
  savedMutationStarted,
  savedListingConfirmed,
  savedRemovalConfirmed,
  savedMutationFailed,
} = likedListingsSlice.actions;
export default likedListingsSlice.reducer;
