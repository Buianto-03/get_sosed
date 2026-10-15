import type { ProfileListing } from '@pages/profile/ui/profile-page/ProfilePage';
import type { PreviewAdvert } from './fixtures';

export function toProfileListings(
  adverts: readonly PreviewAdvert[],
  savedIds: readonly string[],
): ProfileListing[] {
  return adverts.map((advert) => ({
    id: advert.id,
    listing: {
      title: advert.title,
      price: advert.price,
      imageUrl: advert.image || undefined,
      imageAlt: advert.imageAlt || undefined,
      city: advert.city,
      district: advert.district,
      metro: advert.metro,
      tags: advert.tags,
    },
    saved: savedIds.includes(advert.id),
  }));
}
