import { describe, expect, it } from 'vitest';
import { ListingDetailStatus, type ListingSearchRequest } from './listingModel';
import listingReducer from './listingSlice';
import { getFilteredListingsThunk, getListingByIdThunk } from './listingThunk';

describe('listingSlice', () => {
  it('ignores older filtered listing responses', () => {
    const request: ListingSearchRequest = {
      searchKey: '',
      page: 1,
      limit: 8,
      filters: {
        city: '',
        district: '',
        metro: '',
        priceFrom: 0,
        priceTo: 0,
        roomsFrom: 0,
        roomsTo: 0,
        tags: [],
      },
    };
    const first = listingReducer(undefined, getFilteredListingsThunk.pending('old', request));
    const second = listingReducer(first, getFilteredListingsThunk.pending('new', request));
    const stale = listingReducer(
      second,
      getFilteredListingsThunk.fulfilled({ items: [], total: 0, page: 1, limit: 8 }, 'old', request),
    );
    expect(stale.search.loading).toBe(true);
    expect(stale.search.requestId).toBe('new');

    const latest = listingReducer(
      stale,
      getFilteredListingsThunk.fulfilled({ items: [], total: 0, page: 1, limit: 8 }, 'new', request),
    );
    expect(latest.search.loading).toBe(false);
  });
});

it('keeps detail requests separate and ignores stale success and 404 after a new ID', () => {
  const first = listingReducer(undefined, getListingByIdThunk.pending('old', 1));
  const latest = listingReducer(first, getListingByIdThunk.pending('new', 2));
  const stale = listingReducer(latest, getListingByIdThunk.rejected(null, 'old', 1, 404));
  expect(stale.detailStatus).toBe(ListingDetailStatus.Loading);
  expect(stale.chosenListing).toBeNull();
  expect(stale.search.loading).toBe(false);
  const absent = listingReducer(stale, getListingByIdThunk.rejected(null, 'new', 2, 404));
  expect(absent.detailStatus).toBe(ListingDetailStatus.NotFound);
  expect(absent.search.error).toBeNull();
});
