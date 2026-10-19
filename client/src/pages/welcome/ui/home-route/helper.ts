import type { AdvertType } from '@entities/advert/model/advertsModel';
import type { ListingCardData } from '@entities/listing/ui/listing-card/ListingCard';

export function freshestAdverts(adverts: AdvertType[]): AdvertType[] {
  return [...adverts]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id)
    .slice(0, 3);
}

export function toHomeCard(advert: AdvertType): ListingCardData {
  return {
    title: advert.title?.trim() || 'Объявление без названия',
    price: advert.price,
    imageUrl: advert.AdvertPhotos?.find((photo) => photo.photo)?.photo,
    city: advert.location?.city ?? undefined,
    district: advert.location?.district ?? undefined,
    metro: advert.location?.metro ?? undefined,
    tags: advert.tags?.map((tag) => tag.name),
  };
}
