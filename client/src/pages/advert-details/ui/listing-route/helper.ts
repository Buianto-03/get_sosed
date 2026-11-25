import type { Listing } from '@entities/listing/model';
import type { ListingPhoto } from '@entities/listing/ui/listing-gallery/ListingGallery';
import type { ListingContactData } from '@widgets/listing-details/listing-contact-card/ListingContactCard';
import type { ListingInformationData } from '@widgets/listing-details/listing-information/ListingInformation';
import { routes } from '@shared/config/routes';
import { getSafeReturnTo } from '@shared/lib/navigation/safe-return-to';

export function searchDestination(state: unknown): string {
  if (
    !state ||
    typeof state !== 'object' ||
    !('searchReturnTo' in state) ||
    typeof state.searchReturnTo !== 'string'
  ) {
    return routes.listings;
  }
  const safe = getSafeReturnTo(state.searchReturnTo);
  return safe && new URL(safe, 'https://local.invalid').pathname === String(routes.listings)
    ? safe
    : routes.listings;
}

interface ListingDetailsView {
  title: string;
  photos: ListingPhoto[];
  information: ListingInformationData;
  contact: ListingContactData;
}

export function toListingDetails(listing: Listing): ListingDetailsView {
  const { location } = listing;
  return {
    title: listing.title || 'Объявление',
    photos: listing.AdvertPhotos?.flatMap(({ id, photo }) =>
      photo ? [{ id: String(id), src: photo, alt: listing.title || 'Фото жилья' }] : [],
    ) ?? [],
    information: {
      rooms: listing.rooms ?? undefined,
      floor: listing.floor ?? undefined,
      area: listing.square ?? undefined,
      description: listing.body || 'Описание не добавлено',
      tags: listing.tags?.map((tag) => tag.name) ?? [],
      location: {
        city: location?.city ?? undefined,
        district: location?.district ?? undefined,
        metro: location?.metro ?? undefined,
        address: location?.address ?? undefined,
      },
    },
    contact: {
      price: listing.price,
      author: listing.user?.name || 'Автор',
      authorCity: location?.city ?? undefined,
    },
  };
}
