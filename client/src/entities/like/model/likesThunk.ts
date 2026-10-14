import { createAsyncThunk } from '@reduxjs/toolkit';
import likeService from '../api/likeService';
import type { LikeType } from './like';

export const getLikesThunk = createAsyncThunk('likes/getLikesThunk', (id: LikeType['advertId']) =>
  likeService.getLikesByAdvertId(id),
);

export const setLikeThunk = createAsyncThunk('likes/setLikeThunk', (advertId: LikeType['advertId']) =>
  likeService.setLike(advertId),
);

export const deleteLikeThunk = createAsyncThunk(
  'likes/deleteLikeThunk',
  (advertId: LikeType['advertId']) => likeService.deleteLike(advertId),
);
