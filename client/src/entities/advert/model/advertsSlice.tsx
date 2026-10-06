import { createSlice } from '@reduxjs/toolkit';
import {
  getAdvertByIdThunk,
  getAdvertsThunk,
  getFilteredAdvertsThunk,
  getTopAdvertsThunk,
} from './advertsThunk';
import type { AdvertSliceT } from './advert';

const initialState: AdvertSliceT = {
  adverts: [],
  visitableCards: 8,
  chosenAdvert: null,
  populars: [],
  loading: false,
  error: null,
  filterRequestId: null,
};

export const advertSlice = createSlice({
  name: 'advert',
  initialState,
  reducers: {
    loadCards: (state) => {
      state.visitableCards += 8;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFilteredAdvertsThunk.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.filterRequestId = action.meta.requestId;
        state.visitableCards = 8;
      })
      .addCase(getAdvertsThunk.fulfilled, (state, action) => {
        state.adverts = action.payload;
      })
      .addCase(getFilteredAdvertsThunk.fulfilled, (state, action) => {
        if (state.filterRequestId === action.meta.requestId) {
          state.adverts = action.payload;
          state.loading = false;
        }
      })
      .addCase(getFilteredAdvertsThunk.rejected, (state, action) => {
        if (state.filterRequestId === action.meta.requestId) {
          state.loading = false;
          state.error = 'Не удалось загрузить объявления.';
        }
      })
      .addCase(getAdvertByIdThunk.fulfilled, (state, action) => {
        state.chosenAdvert = action.payload;
      })
      .addCase(getTopAdvertsThunk.fulfilled, (state, action) => {
        state.populars = action.payload;
      });
  },
});
export const { loadCards } = advertSlice.actions;

export default advertSlice.reducer;
