import { createSlice } from '@reduxjs/toolkit';
import type { AdvertSliceT } from '../../../types/advert';
import { getAdvertsThunk } from './advertsThunk';

const initialState: AdvertSliceT = {
  adverts: [],
};

export const advertSlice = createSlice({
  name: 'advert',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAdvertsThunk.fulfilled, (state, action) => {
      state.adverts = action.payload;
    });
  },
});

// Action creators are generated for each case reducer function
export default advertSlice.reducer;
