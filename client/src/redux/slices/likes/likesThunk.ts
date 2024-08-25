import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AdvertType } from '../../../types/advert';
import likeService from '../../../services/likeService';

export const getLikesThunk = createAsyncThunk(
  'likes/getLikesThunk',
  (id: AdvertType['id']) => likeService.getLikesByAdvertId(id),
);

export const a = '1';
