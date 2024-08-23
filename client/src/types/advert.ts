import { z } from 'zod';

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
  User: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    roleId: z.number(),
  }),
  Location: z.object({
    id: z.number(),
    city: z.string(),
    district: z.string(),
    address: z.string(),
    metro: z.string(),
    coordinates: z.string(),
    advertId: z.number(),
  }),
});

export type AdvertType = z.infer<typeof advertSchema>;

export type FilterType = {
  priceFrom: number;
  priceTo: number;
  city: string;
  district: string;
  metro: string;
  category: string;
};

export type AdvertSliceT = {
  adverts: AdvertType[];
  chosenAdvert: AdvertType | null;
  visitableCards: number;
  query: string;
  filters: FilterType;
};
