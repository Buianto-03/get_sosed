import { createAsyncThunk } from '@reduxjs/toolkit';
import advertService from '../api/advertService';
import { SavedStatus, type LikedAdvert, type SavedRoot } from './likedAdvertsModel';

export const getLikedAdvertsThunk = createAsyncThunk<LikedAdvert[], void, { state: SavedRoot }>(
  'likedAdverts/get',
  () => advertService.getLikedAdverts(),
  {
    condition: (_, { getState }) => {
      const state = getState().likedAdverts;
      return state.status !== SavedStatus.Loading && Object.keys(state.pending).length === 0;
    },
  },
);
