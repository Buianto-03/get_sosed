import { toListingCardData, type Listing, type ListingCardData } from '@entities/listing/model';

export function toHomeCard(listing: Listing): ListingCardData {
  return toListingCardData(listing, listing.title?.trim() || 'Объявление без названия');
}
