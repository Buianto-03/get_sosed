import type { Listing } from './listingModel';

export interface ListingCardData {
  title: string;
  price: number | null;
  imageUrl?: string;
  photos?: readonly string[];
  imageAlt?: string;
  city?: string;
  district?: string;
  metro?: string;
  tags?: readonly string[];
}

export function toListingCardData(listing: Listing, title: string): ListingCardData {
  return {
    title,
    price: listing.price,
    photos: (listing.photos ?? [])
      .map((photo) => photo.photo)
      .filter((src): src is string => Boolean(src)),
    city: listing.location?.city ?? undefined,
    district: listing.location?.district ?? undefined,
    metro: listing.location?.metro ?? undefined,
    tags: listing.tags?.map((tag) => tag.name),
  };
}
