import { z } from 'zod';
import { photoSchema } from './photo';

export const tagSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

export const listingSchema = z.object({
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
  user: z
    .object({
      id: z.number(),
      name: z.string().nullable(),
      email: z.string().nullable(),
    })
    .nullable(),
  location: z
    .object({
      id: z.number(),
      city: z.string().nullable(),
      district: z.string().nullable(),
      address: z.string().nullable(),
      metro: z.string().nullable(),
      coordinates: z.string().nullable(),
      listingId: z.number(),
    })
    .nullable(),
  tags: z.array(tagSchema).optional(),
  photos: z.array(photoSchema).nullable().optional(),
});

export const collectionListingSchema = listingSchema.extend({
  tags: tagSchema.array(),
  photos: photoSchema.array(),
});

export type Listing = z.infer<typeof listingSchema>;

export const listingPageSchema = z.object({
  items: listingSchema.array(),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(50),
});

export const filteredListingPageSchema = listingPageSchema
  .extend({
    items: collectionListingSchema.array(),
    total: listingPageSchema.shape.total.safe(),
    page: listingPageSchema.shape.page.safe(),
  })
  .strict()
  .refine(({ items, limit }) => items.length <= limit, {
    path: ['items'],
    message: 'Page exceeds limit',
  });

export type ListingPage = z.infer<typeof listingPageSchema>;

export type ListingFilters = {
  priceFrom: number;
  priceTo: number;
  city: string;
  district: string;
  metro: string;
  roomsFrom: number;
  roomsTo: number;
};

export type TagType = z.infer<typeof tagSchema>;

export enum ListingDetailStatus {
  Idle = 'idle',
  Loading = 'loading',
  Ready = 'ready',
  NotFound = 'not-found',
  Error = 'error',
}

export interface ListingSearchRequest {
  filters: ListingFilters & { tags: TagType[] };
  searchKey: string;
  page: number;
  limit: number;
}

export interface ListingSearchState {
  items: Listing[];
  total: number;
  page: number;
  limit: number;
  searchKey: string | null;
  loading: boolean;
  error: string | null;
  loadingMore: boolean;
  loadMoreError: string | null;
  requestId: string | null;
}

export type ListingState = {
  search: ListingSearchState;
  chosenListing: Listing | null;
  populars: Listing[];
  detailStatus: ListingDetailStatus;
  detailRequestId: string | null;
};

export type PostListingType = {
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
