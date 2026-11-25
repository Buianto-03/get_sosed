import { createSlice } from '@reduxjs/toolkit';
import { isRequestCanceled } from '@shared/api/cancellation';
import { getListingByIdThunk, getFilteredListingsThunk, getTopListingsThunk } from './listingThunk';
import { ListingDetailStatus, type ListingState } from './listingModel';

const initialState: ListingState = {
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
  chosenListing: null,
  populars: [],
  detailStatus: ListingDetailStatus.Idle,
  detailRequestId: null,
};

export const listingSlice = createSlice({
  name: 'listing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getFilteredListingsThunk.pending, (state, action) => {
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
      .addCase(getFilteredListingsThunk.fulfilled, (state, action) => {
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
      .addCase(getFilteredListingsThunk.rejected, (state, action) => {
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
      .addCase(getListingByIdThunk.pending, (state, action) => {
        if (state.chosenListing?.id !== action.meta.arg) {
          state.chosenListing = null;
        }
        state.detailStatus = ListingDetailStatus.Loading;
        state.detailRequestId = action.meta.requestId;
      })
      .addCase(getListingByIdThunk.fulfilled, (state, action) => {
        if (state.detailRequestId !== action.meta.requestId) {
          return;
        }
        state.detailRequestId = null;
        state.chosenListing = action.payload;
        state.detailStatus = ListingDetailStatus.Ready;
      })
      .addCase(getListingByIdThunk.rejected, (state, action) => {
        if (state.detailRequestId !== action.meta.requestId) {
          return;
        }
        state.detailRequestId = null;
        if (action.meta.aborted || isRequestCanceled(action.error)) {
          state.detailStatus = state.chosenListing
            ? ListingDetailStatus.Ready
            : ListingDetailStatus.Idle;
        } else {
          state.detailStatus =
            action.payload === 404 ? ListingDetailStatus.NotFound : ListingDetailStatus.Error;
        }
      })
      .addCase(getTopListingsThunk.fulfilled, (state, action) => {
        state.populars = action.payload;
      });
  },
});
export default listingSlice.reducer;
