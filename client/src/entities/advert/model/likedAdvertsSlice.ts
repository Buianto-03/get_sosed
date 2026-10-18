import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  SavedStatus,
  type SavedState,
  type SaveRequest,
  type SaveSuccess,
  type SaveFailure,
} from './likedAdvertsModel';
import { getLikedAdvertsThunk } from './likedAdvertsThunk';

const initialState: SavedState = {
  items: [],
  savedIds: [],
  status: SavedStatus.Idle,
  error: null,
  pending: {},
  errors: {},
  requestId: null,
};

const likedAdvertsSlice = createSlice({
  name: 'likedAdverts',
  initialState,
  reducers: {
    resetSavedAdverts: () => initialState,
    savedMutationStarted: (state, { payload }: PayloadAction<SaveRequest>) => {
      state.pending[payload.advertId] = payload.requestId;
      delete state.errors[payload.advertId];
    },
    savedAdvertConfirmed: (state, { payload }: PayloadAction<SaveSuccess>) => {
      const { advertId, requestId, item } = payload;
      if (state.pending[advertId] !== requestId) return;
      state.items = state.items.filter((entry) => entry.advertId !== advertId);
      state.items.push(item);
      if (!state.savedIds.includes(advertId)) state.savedIds.push(advertId);
      delete state.pending[advertId];
    },
    savedRemovalConfirmed: (state, { payload }: PayloadAction<SaveRequest>) => {
      const { advertId, requestId } = payload;
      if (state.pending[advertId] !== requestId) return;
      state.items = state.items.filter((item) => item.advertId !== advertId);
      state.savedIds = state.savedIds.filter((id) => id !== advertId);
      delete state.pending[advertId];
    },
    savedMutationFailed: (state, { payload }: PayloadAction<SaveFailure>) => {
      const { advertId, requestId, error } = payload;
      if (state.pending[advertId] !== requestId) return;
      delete state.pending[advertId];
      state.errors[advertId] = error;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLikedAdvertsThunk.pending, (state, action) => {
        state.status = SavedStatus.Loading;
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(getLikedAdvertsThunk.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.items = action.payload;
        state.savedIds = [...new Set(action.payload.map((item) => item.advertId))];
        state.status = SavedStatus.Ready;
        state.requestId = null;
      })
      .addCase(getLikedAdvertsThunk.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = SavedStatus.Error;
        state.error = 'Не удалось загрузить избранное.';
        state.requestId = null;
      });
  },
});
export const {
  resetSavedAdverts,
  savedMutationStarted,
  savedAdvertConfirmed,
  savedRemovalConfirmed,
  savedMutationFailed,
} = likedAdvertsSlice.actions;
export default likedAdvertsSlice.reducer;
