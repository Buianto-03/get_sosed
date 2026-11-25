import { toListingCardData, type Listing, type ListingCardData } from '@entities/listing/model';
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
export function toProfileListing(listing: Listing): ListingCardData {
  return toListingCardData(listing, listing.title || 'Объявление');
}
