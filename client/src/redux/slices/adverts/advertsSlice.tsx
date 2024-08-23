import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AdvertSliceT, AdvertType } from '../../../types/advert';
import { getAdvertsThunk } from './advertsThunk';

const initialState: AdvertSliceT = {
  adverts: [],
  visitableCards: 8,
  query: '',
};

export const advertSlice = createSlice({
  name: 'advert',
  initialState,
  reducers: {
    loadCards: (state) => {
      state.visitableCards += 8;
    },
    setAdverts: (state, action: PayloadAction<AdvertType[]>) => {
      state.adverts = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getAdvertsThunk.fulfilled, (state, action) => {
      state.adverts = action.payload;
    });
  },
});
export const { loadCards, setAdverts, setSearchQuery } = advertSlice.actions;

export default advertSlice.reducer;
