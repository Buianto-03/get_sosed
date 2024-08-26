import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AdvertType } from '../../../types/advert';
import likeService from '../../../services/likeService';
import type { LikeType } from '../../../types/like';

export const getLikesThunk = createAsyncThunk('likes/getLikesThunk', (id: LikeType['advertId']) =>
  likeService.getLikesByAdvertId(id),
);

export const setLikeThunk = createAsyncThunk('likes/setLikeThunk', (advertId: AdvertType['id']) =>
  likeService.setLike(advertId),
);

export const deleteLikeThunk = createAsyncThunk('likes/deleteLikeThunk', (id: LikeType['id']) =>
  likeService.deleteLike(id),
);
