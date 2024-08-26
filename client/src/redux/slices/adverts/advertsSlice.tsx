import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { getAdvertByIdThunk, getAdvertsThunk, getFilteredAdvertsThunk } from './advertsThunk';
import type { AdvertSliceT, AdvertType, FilterType } from '../../../types/advert';

const initialState: AdvertSliceT = {
  adverts: [],
  visitableCards: 8,
  query: '',
  chosenAdvert: null,
  filters: {
    priceFrom: 0,
    priceTo: 400000,
    city: '',
    district: '',
    metro: '',
    category: '',
  },
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
    setChosenAdvert: (state, action: PayloadAction<AdvertType>) => {
      state.chosenAdvert = action.payload;
    },
    setFilters: (state, action: PayloadAction<FilterType>) => {
      state.filters = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAdvertsThunk.fulfilled, (state, action) => {
        state.adverts = action.payload;
      })
      .addCase(getFilteredAdvertsThunk.fulfilled, (state, action) => {
        state.adverts = action.payload;
      })
      .addCase(getAdvertByIdThunk.fulfilled, (state, action) => {
        state.chosenAdvert = action.payload;
      });
  },
});
export const { loadCards, setAdverts, setSearchQuery, setChosenAdvert, setFilters } =
  advertSlice.actions;

export default advertSlice.reducer;
