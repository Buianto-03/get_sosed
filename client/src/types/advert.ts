import { z } from 'zod';

export const advertSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  price: z.number(),
  userId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  User: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
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
