import { createAsyncThunk } from '@reduxjs/toolkit';
import likeService from '../api/likeService';
import type { LikeType } from './like';

export const getLikesThunk = createAsyncThunk(
  'likes/getLikesThunk',
  (id: LikeType['listingId'], { signal }) => likeService.getLikesByListingId(id, { signal }),
);

export const setLikeThunk = createAsyncThunk(
  'likes/setLikeThunk',
  (listingId: LikeType['listingId']) => likeService.setLike(listingId),
);

export const deleteLikeThunk = createAsyncThunk(
  'likes/deleteLikeThunk',
  (listingId: LikeType['listingId']) => likeService.deleteLike(listingId),
);
