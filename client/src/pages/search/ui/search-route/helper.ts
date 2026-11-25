import {
  toListingCardData,
  type Listing,
  type ListingCardData,
  type ListingSearchRequest,
} from '@entities/listing/model';
import type { AppliedFilters } from '@features/listing-filter/model/filters';

export function buildSearchRequest(
  { tagIds, ...filters }: AppliedFilters,
  searchKey: string,
  page: number,
): ListingSearchRequest {
  return {
    filters: { ...filters, tags: tagIds.map((id) => ({ id, name: '' })) },
    searchKey,
    page,
    limit: 8,
  };
}

export function toSearchCard(listing: Listing): ListingCardData {
  return toListingCardData(listing, listing.title || 'Объявление');
}
