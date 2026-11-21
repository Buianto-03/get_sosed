import type { AdvertType } from '@entities/advert/model/advertsModel';
import type { ListingCardData } from '@entities/listing/ui/listing-card/ListingCard';
import type { BackendUserT } from '@entities/session/model/authModel';
import { getMediaUrl } from '@shared/config/media';
import type { ProfileDetails } from './ui/profile-page/ProfilePage';

export function toProfile(user: BackendUserT): ProfileDetails {
  return {
    name: user.name,
    city: user.UserProfile?.city ?? '',
    intent: user.UserProfile?.intent ?? '',
    description: user.UserProfile?.about ?? '',
    habits: user.UserProfile?.habits ?? [],
    avatarUrl: getMediaUrl(user.UserProfile?.photo),
  };
}
export function toProfileListing(advert: AdvertType): ListingCardData {
  return {
    title: advert.title || 'Объявление',
    price: advert.price,
    photos: (advert.AdvertPhotos ?? [])
      .map((photo) => photo.photo)
      .filter((src): src is string => Boolean(src)),
    city: advert.location?.city ?? undefined,
    district: advert.location?.district ?? undefined,
    metro: advert.location?.metro ?? undefined,
    tags: advert.tags?.map((tag) => tag.name),
  };
}
