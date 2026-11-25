import { isAxiosError } from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { isRequestCanceled } from '@shared/api/cancellation';
import { listingService } from '../api/listingService';
import type { ListingPage, ListingSearchRequest, ListingState, Listing } from './listingModel';

export const getFilteredListingsThunk = createAsyncThunk<
  ListingPage,
  ListingSearchRequest,
  { state: { listing: ListingState } }
>(
  'listings/getFilteredListings',
  async ({ filters, page, limit }, { signal }) =>
    listingService.getFilteredListingsPage(filters, page, limit, { signal }),
  {
    condition: ({ searchKey, page, limit }, { getState }) => {
      if (page === 1) {
        return true;
      }
      const { search } = getState().listing;
      return (
        search.searchKey === searchKey &&
        search.requestId === null &&
        !search.loading &&
        !search.error &&
        search.page > 0 &&
        search.page + 1 === page &&
        search.limit === limit &&
        search.page * search.limit < search.total
      );
    },
  },
);

export const getListingByIdThunk = createAsyncThunk<Listing, number, { rejectValue: number }>(
  'listings/getListingByIdThunk',
  async (id, { rejectWithValue, signal }) => {
    try {
      return await listingService.getListingById(id, { signal });
    } catch (error) {
      if (isRequestCanceled(error)) {
        throw error;
      }
      return rejectWithValue(isAxiosError(error) ? error.response?.status ?? 500 : 500);
    }
  },
);

export const getTopListingsThunk = createAsyncThunk('listings/getTopListings', async (_, { signal }) =>
  listingService.getTopListings({ signal }),
);
