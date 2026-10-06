import { createSlice } from '@reduxjs/toolkit';
import type { LikeSliceTtype } from './like';
import { deleteLikeThunk, getLikesThunk, setLikeThunk } from './likesThunk';

const initialState: LikeSliceTtype = {
  likes: [],
};

export const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {},
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
      });
  },
});

export default likesSlice.reducer;
