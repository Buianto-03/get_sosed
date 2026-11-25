import type { ListingSearchState, ListingState } from './listingModel';

export const selectListingState = (state: { listing: ListingState }): ListingState => state.listing;

export const selectListingSearch = (state: { listing: ListingState }): ListingSearchState =>
  state.listing.search;

export const selectSearchHasMore = (state: { listing: ListingState }): boolean => {
  const { page, limit, total } = state.listing.search;
  return page > 0 && page * limit < total;
};
