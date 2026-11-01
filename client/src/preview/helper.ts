import type { ProfileListing } from '@pages/profile/ui/profile-page/ProfilePage';
import type { UploadAreaPhoto } from '@shared/ui/upload-area/UploadArea';
import type { PreviewAdvert } from './fixtures';

// Presentation-only files; real file decoding/upload is checked through the API scenario.
export function createPublicationPhotoFixtures(): UploadAreaPhoto[] {
  if (new URLSearchParams(window.location.search).get('photos') !== 'sample') {
    return [];
  }
  return ['/mainPhoto.jpg', '/images/2pic.jpg', '/images/1pic.jpg'].map((previewUrl, index) => ({
    id: `preview-photo-${index}`,
    file: new File([], `комната-${index + 1}.jpg`, { type: 'image/jpeg' }),
    previewUrl,
    isMain: index === 0,
  }));
}

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
