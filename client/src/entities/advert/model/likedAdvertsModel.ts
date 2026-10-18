import { z } from 'zod';
import { advertSchema } from './advert';

export const likedAdvertSchema = z.object({
  id: z.number(),
  advertId: z.number(),
  userId: z.number(),
  Advert: advertSchema,
});
export type LikedAdvert = z.infer<typeof likedAdvertSchema>;

export enum SavedStatus {
  Idle = 'idle',
  Loading = 'loading',
  Ready = 'ready',
  Error = 'error',
}
export interface SavedState {
  items: LikedAdvert[];
  savedIds: number[];
  status: SavedStatus;
  error: string | null;
  pending: Record<number, string>;
  errors: Record<number, string>;
  requestId: string | null;
}
export interface SavedRoot {
  likedAdverts: SavedState;
}

export interface SaveRequest {
  advertId: number;
  requestId: string;
}
export interface SaveSuccess extends SaveRequest {
  item: LikedAdvert;
}
export interface SaveFailure extends SaveRequest {
  error: string;
}
