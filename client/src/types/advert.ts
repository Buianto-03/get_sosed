import { z } from 'zod';
import { userSchema } from './auth';
import { photoSchema } from './photo';
import type { LikedAdvertsType } from './like';

export const advertSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  price: z.number(),
  userId: z.number(),
  floor: z.number(),
  rooms: z.number(),
  square: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  User: userSchema,
  Location: z.object({
    id: z.number(),
    city: z.string(),
    district: z.string(),
    address: z.string(),
    metro: z.string(),
    coordinates: z.string(),
    advertId: z.number(),
  }),
  AdvertPhotos: z.array(photoSchema).nullable().optional(),
});

export type AdvertType = z.infer<typeof advertSchema>;

export type FilterType = {
  priceFrom: number;
  priceTo: number;
  city: string;
  district: string;
  metro: string;
  // category: string;
  roomsFrom: number;
  roomsTo: number;
};

export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type TagType = z.infer<typeof tagSchema>;

export type AdvertSliceT = {
  adverts: AdvertType[];
  chosenAdvert: AdvertType | null;
  visitableCards: number;
  query: string;
  filters: FilterType;
  tags: TagType[];
  populars: AdvertType[];
  liked: LikedAdvertsType[];
  pickedTags: TagType[];
};

export type PostAdvertType = {
  title: string;
  body: string;
  price: string;
  userId: string;
  floor: string;
  rooms: string;
  square: string;
  city: string;
  district: string;
  metro: string;
  address: string;
  // title, body, price, floor, square, rooms, city, district, address, metro
  coordinates: string;
};
