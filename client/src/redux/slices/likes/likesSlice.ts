import { createSlice } from '@reduxjs/toolkit';
import type { LikeSliceTtype } from '../../../types/like';
import { getLikesThunk } from './likesThunk';

const initialState: LikeSliceTtype = {
  likes: [],
};

export const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    // setLikes: (state, action) => {
    //     state.likes = action.payload
    // }
  },
  extraReducers: (builder) => {
    builder.addCase(getLikesThunk.fulfilled, (state, action) => {
      state.likes = action.payload;
    });
  },
});

// export const {  } = likesSlice.actions;

export default likesSlice.reducer;
