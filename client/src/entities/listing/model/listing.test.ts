import { describe, expect, it } from 'vitest';
import { listingSchema } from './listingModel';

const listing = {
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
    id: 1, listingId: 1, city: 'Москва', district: null,
    address: null, metro: null, coordinates: null,
  },
  tags: [{ id: 8, name: 'Для некурящих' }],
  photos: [],
};

describe('listingSchema', () => {
  it('retains real tag IDs and accepts nullable location fields and no photos', () => {
    const parsed = listingSchema.parse(listing);
    expect(parsed.tags).toEqual(listing.tags);
    expect(parsed.location?.coordinates).toBeNull();
    expect(parsed.photos).toEqual([]);
  });

  it('accepts legacy nullable values and absent relationships', () => {
    const parsed = listingSchema.parse({
      ...listing, title: null, body: null, price: null, floor: null,
      rooms: null, square: null, userId: null, user: null, location: null,
      tags: undefined, photos: null,
    });
    expect(parsed.user).toBeNull();
    expect(parsed.location).toBeNull();
  });

  it('normalizes multiple photo URLs without changing their order', () => {
    const parsed = listingSchema.parse({
      ...listing,
      photos: [
        { id: 3, listingId: 1, photo: '/images/first.webp' },
        { id: 8, listingId: 1, photo: 'https://cdn.example.com/second.webp' },
        { id: 9, listingId: 1, photo: null },
      ],
    });
    expect(parsed.photos?.map(({ photo }) => photo)).toEqual([
      `${window.location.origin}/images/first.webp`,
      'https://cdn.example.com/second.webp',
      undefined,
    ]);
  });

  it('still rejects invalid field types, photo IDs and tag IDs', () => {
    expect(listingSchema.safeParse({ ...listing, price: '30000' }).success).toBe(false);
    expect(listingSchema.safeParse({ ...listing, tags: [{ id: '8', name: 'Тег' }] }).success).toBe(false);
    expect(listingSchema.safeParse({
      ...listing, photos: [{ id: '3', listingId: 1, photo: '/images/a.webp' }],
    }).success).toBe(false);
  });
});
