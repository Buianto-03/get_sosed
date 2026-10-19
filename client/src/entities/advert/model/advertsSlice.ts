import { createSlice } from '@reduxjs/toolkit';
import {
  getAdvertByIdThunk,
  getAdvertsThunk,
  getFilteredAdvertsThunk,
  getTopAdvertsThunk,
} from './advertsThunk';
import { AdvertDetailStatus, type AdvertSliceT } from './advertsModel';

const initialState: AdvertSliceT = {
  adverts: [],
  visitableCards: 8,
  chosenAdvert: null,
  populars: [],
  loading: false,
  error: null,
  filterRequestId: null,
  detailStatus: AdvertDetailStatus.Idle,
  detailRequestId: null,
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
      .addCase(getAdvertByIdThunk.pending, (state, action) => {
        state.chosenAdvert = null;
        state.detailStatus = AdvertDetailStatus.Loading;
        state.detailRequestId = action.meta.requestId;
      })
      .addCase(getAdvertByIdThunk.fulfilled, (state, action) => {
        if (state.detailRequestId !== action.meta.requestId) return;
        state.chosenAdvert = action.payload;
        state.detailStatus = AdvertDetailStatus.Ready;
      })
      .addCase(getAdvertByIdThunk.rejected, (state, action) => {
        if (state.detailRequestId !== action.meta.requestId) return;
        state.detailStatus =
          action.payload === 404 ? AdvertDetailStatus.NotFound : AdvertDetailStatus.Error;
      })
      .addCase(getTopAdvertsThunk.fulfilled, (state, action) => {
        state.populars = action.payload;
      });
  },
});
export const { loadCards } = advertSlice.actions;

export default advertSlice.reducer;
