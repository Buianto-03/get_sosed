import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LikeSliceType } from './like';
import { deleteLikeThunk, getLikesThunk, setLikeThunk } from './likesThunk';

const initialState: LikeSliceType = {
  likes: [],
  requests: {},
  readRequestId: null,
  advertId: null,
  userId: null,
};

export const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: { resetLikes: (_, action: PayloadAction<number | null>) => ({ ...initialState, userId: action.payload }) },
  extraReducers: (builder) => {
    builder
      .addCase(getLikesThunk.pending, (state, action) => {
        state.readRequestId = action.meta.requestId;
        state.advertId = action.meta.arg;
        state.likes = [];
      })
      .addCase(getLikesThunk.fulfilled, (state, action) => {
        if (state.readRequestId !== action.meta.requestId) return;
        state.readRequestId = null;
        state.likes = action.payload;
      })
      .addCase(setLikeThunk.pending, (state, action) => {
        state.requests[action.meta.requestId] = true;
      })
      .addCase(deleteLikeThunk.pending, (state, action) => {
        state.requests[action.meta.requestId] = true;
      })
      .addCase(setLikeThunk.rejected, (state, action) => { delete state.requests[action.meta.requestId]; })
      .addCase(deleteLikeThunk.rejected, (state, action) => { delete state.requests[action.meta.requestId]; })
      .addCase(setLikeThunk.fulfilled, (state, action) => {
        if (state.requests[action.meta.requestId] !== true) return;
        delete state.requests[action.meta.requestId];
        if (state.advertId !== action.payload.advertId) return;
        if (!state.likes.some((like) => like.id === action.payload.id)) state.likes.push(action.payload);
      })
      .addCase(deleteLikeThunk.fulfilled, (state, action) => {
        if (state.requests[action.meta.requestId] !== true) return;
        delete state.requests[action.meta.requestId];
        state.likes = state.likes.filter((like) => like.advertId !== action.payload.advertId || like.userId !== state.userId);
      });
  },
});

export const { resetLikes } = likesSlice.actions;
export default likesSlice.reducer;
