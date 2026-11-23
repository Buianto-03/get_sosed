import { createSlice } from '@reduxjs/toolkit';
import { isRequestCanceled } from '@shared/api/cancellation';
import { getAdvertByIdThunk, getFilteredAdvertsThunk, getTopAdvertsThunk } from './advertsThunk';
import { AdvertDetailStatus, type AdvertSliceT } from './advertsModel';

const initialState: AdvertSliceT = {
  search: {
    items: [],
    total: 0,
    page: 0,
    limit: 8,
    searchKey: null,
    loading: false,
    error: null,
    loadingMore: false,
    loadMoreError: null,
    requestId: null,
  },
  chosenAdvert: null,
  populars: [],
  detailStatus: AdvertDetailStatus.Idle,
  detailRequestId: null,
};

export const advertSlice = createSlice({
  name: 'advert',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getFilteredAdvertsThunk.pending, (state, action) => {
        const { search } = state;
        const { searchKey, page, limit } = action.meta.arg;
        if (search.searchKey !== searchKey) {
          search.items = [];
          search.total = 0;
          search.page = 0;
        }
        search.searchKey = searchKey;
        search.limit = limit;
        search.loading = page === 1;
        search.loadingMore = page > 1;
        search.error = null;
        search.loadMoreError = null;
        search.requestId = action.meta.requestId;
      })
      .addCase(getFilteredAdvertsThunk.fulfilled, (state, action) => {
        const { search } = state;
        if (
          search.requestId !== action.meta.requestId ||
          search.searchKey !== action.meta.arg.searchKey
        ) {
          return;
        }
        const { items, total, page, limit } = action.payload;
        const previous = action.meta.arg.page === 1 ? [] : search.items;
        search.items = [
          ...new Map([...previous, ...items].map((item) => [item.id, item])).values(),
        ];
        search.total = total;
        search.page = page;
        search.limit = limit;
        search.loading = false;
        search.loadingMore = false;
        search.requestId = null;
      })
      .addCase(getFilteredAdvertsThunk.rejected, (state, action) => {
        const { search } = state;
        if (
          search.requestId !== action.meta.requestId ||
          search.searchKey !== action.meta.arg.searchKey
        ) {
          return;
        }
        search.loading = false;
        search.loadingMore = false;
        search.requestId = null;
        if (!action.meta.aborted && !isRequestCanceled(action.error)) {
          if (action.meta.arg.page === 1) {
            search.error = 'Не удалось загрузить объявления.';
          } else {
            search.loadMoreError = 'Не удалось загрузить следующие объявления.';
          }
        }
      })
      .addCase(getAdvertByIdThunk.pending, (state, action) => {
        if (state.chosenAdvert?.id !== action.meta.arg) {
          state.chosenAdvert = null;
        }
        state.detailStatus = AdvertDetailStatus.Loading;
        state.detailRequestId = action.meta.requestId;
      })
      .addCase(getAdvertByIdThunk.fulfilled, (state, action) => {
        if (state.detailRequestId !== action.meta.requestId) {
          return;
        }
        state.detailRequestId = null;
        state.chosenAdvert = action.payload;
        state.detailStatus = AdvertDetailStatus.Ready;
      })
      .addCase(getAdvertByIdThunk.rejected, (state, action) => {
        if (state.detailRequestId !== action.meta.requestId) {
          return;
        }
        state.detailRequestId = null;
        if (action.meta.aborted || isRequestCanceled(action.error)) {
          state.detailStatus = state.chosenAdvert
            ? AdvertDetailStatus.Ready
            : AdvertDetailStatus.Idle;
        } else {
          state.detailStatus =
            action.payload === 404 ? AdvertDetailStatus.NotFound : AdvertDetailStatus.Error;
        }
      })
      .addCase(getTopAdvertsThunk.fulfilled, (state, action) => {
        state.populars = action.payload;
      });
  },
});
export default advertSlice.reducer;
