import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { LikeSliceTtype, LikeType } from '../../../types/like';
import { deleteLikeThunk, getLikesThunk, setLikeThunk } from './likesThunk';

const initialState: LikeSliceTtype = {
  likes: [],
  selectedLike: null,
};

export const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    setSelectedLike: (state, action: PayloadAction<LikeType>) => {
      state.selectedLike = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLikesThunk.fulfilled, (state, action) => {
        state.likes = action.payload;
      })
      .addCase(setLikeThunk.fulfilled, (state, action) => {
        state.likes.push(action.payload);
      })
      .addCase(deleteLikeThunk.fulfilled, (state, action) => {
        state.likes = state.likes.filter((like) => like.id !== action.payload.id);
        state.selectedLike = null;
      });
  },
});

export const { setSelectedLike } = likesSlice.actions;

export default likesSlice.reducer;
