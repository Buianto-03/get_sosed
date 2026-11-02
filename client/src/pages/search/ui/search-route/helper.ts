import type { AdvertType } from '@entities/advert/model/advertsModel';
import type { ListingCardData } from '@entities/listing/ui/listing-card/ListingCard';

export function toSearchCard(advert: AdvertType): ListingCardData {
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
