import { z } from 'zod';
import { photoSchema } from './photo';

export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const advertSchema = z.object({
  id: z.number(),
  title: z.string().nullable(),
  body: z.string().nullable(),
  price: z.number().nullable(),
  userId: z.number().nullable(),
  floor: z.number().nullable(),
  rooms: z.number().nullable(),
  square: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    id: z.number(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).nullable(),
  location: z.object({
    id: z.number(),
    city: z.string().nullable(),
    district: z.string().nullable(),
    address: z.string().nullable(),
    metro: z.string().nullable(),
    coordinates: z.string().nullable(),
    advertId: z.number(),
  }).nullable(),
  tags: z.array(tagSchema).optional(),
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

export type TagType = z.infer<typeof tagSchema>;

export type AdvertSliceT = {
  adverts: AdvertType[];
  chosenAdvert: AdvertType | null;
  visitableCards: number;
  populars: AdvertType[];
  loading: boolean;
  error: string | null;
  filterRequestId: string | null;
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
