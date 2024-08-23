import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AdvertSliceT, AdvertType } from '../../../types/advert';
import { getAdvertsThunk } from './advertsThunk';

const initialState: AdvertSliceT = {
  adverts: [],
  chosenAdvert: null,
};

export const advertSlice = createSlice({
  name: 'advert',
  initialState,
  reducers: {
    setChosenAdvert: (state, action: PayloadAction<AdvertType>) => {
      state.chosenAdvert = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getAdvertsThunk.fulfilled, (state, action) => {
      state.adverts = action.payload;
    });
  },
});

export const { setChosenAdvert } = advertSlice.actions;

// Action creators are generated for each case reducer function
export default advertSlice.reducer;
