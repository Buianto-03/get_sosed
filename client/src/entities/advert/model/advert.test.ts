import { describe, expect, it } from 'vitest';
import { advertSchema } from './advertsModel';

const advert = {
  id: 1,
  title: 'Квартира',
  body: 'Описание',
  price: 30000,
  userId: 2,
  floor: 3,
  rooms: 2,
  square: 40,
  createdAt: '2026-10-18T00:00:00.000Z',
  updatedAt: '2026-10-18T00:00:00.000Z',
  user: { id: 2, name: 'Сосед', email: 'user@example.com' },
  location: {
    id: 1, advertId: 1, city: 'Москва', district: null,
    address: null, metro: null, coordinates: null,
  },
  tags: [{ id: 8, name: 'Для некурящих' }],
  AdvertPhotos: [],
};

describe('advertSchema', () => {
  it('retains real tag IDs and accepts nullable location fields and no photos', () => {
    const parsed = advertSchema.parse(advert);
    expect(parsed.tags).toEqual(advert.tags);
    expect(parsed.location?.coordinates).toBeNull();
    expect(parsed.AdvertPhotos).toEqual([]);
  });

  it('accepts legacy nullable values and absent relationships', () => {
    const parsed = advertSchema.parse({
      ...advert, title: null, body: null, price: null, floor: null,
      rooms: null, square: null, userId: null, user: null, location: null,
      tags: undefined, AdvertPhotos: null,
    });
    expect(parsed.user).toBeNull();
    expect(parsed.location).toBeNull();
  });

  it('normalizes multiple photo URLs without changing their order', () => {
    const parsed = advertSchema.parse({
      ...advert,
      AdvertPhotos: [
        { id: 3, advertId: 1, photo: '/images/first.webp' },
        { id: 8, advertId: 1, photo: 'https://cdn.example.com/second.webp' },
        { id: 9, advertId: 1, photo: null },
      ],
    });
    expect(parsed.AdvertPhotos?.map(({ photo }) => photo)).toEqual([
      `${window.location.origin}/images/first.webp`,
      'https://cdn.example.com/second.webp',
      undefined,
    ]);
  });

  it('still rejects invalid field types, photo IDs and tag IDs', () => {
    expect(advertSchema.safeParse({ ...advert, price: '30000' }).success).toBe(false);
    expect(advertSchema.safeParse({ ...advert, tags: [{ id: '8', name: 'Тег' }] }).success).toBe(false);
    expect(advertSchema.safeParse({
      ...advert, AdvertPhotos: [{ id: '3', advertId: 1, photo: '/images/a.webp' }],
    }).success).toBe(false);
  });
});
