import { z } from 'zod';
import { listingSchema } from './listingModel';

export const likedListingSchema = z.object({
  id: z.number(),
  listingId: z.number(),
  userId: z.number(),
  listing: listingSchema,
});
export type LikedListing = z.infer<typeof likedListingSchema>;

export enum SavedStatus {
  Idle = 'idle',
  Loading = 'loading',
  Ready = 'ready',
  Error = 'error',
}
export interface SavedState {
  items: LikedListing[];
  savedIds: number[];
  status: SavedStatus;
  initialized: boolean;
  error: string | null;
  pending: Record<number, string>;
  errors: Record<number, string>;
  requestId: string | null;
}
export interface SavedRoot {
  likedListings: SavedState;
}

export interface SaveRequest {
  listingId: number;
  requestId: string;
}
export interface SaveSuccess extends SaveRequest {
  item: LikedListing;
}
export interface SaveFailure extends SaveRequest {
  error: string;
}
