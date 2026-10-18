import { createAsyncThunk } from '@reduxjs/toolkit';
import { SavedStatus, type LikedAdvert, type SavedRoot, type SavedState } from '@entities/advert/model/likedAdvertsModel';
import type { AdvertType } from '@entities/advert/model/advert';
import {
  savedMutationStarted, savedAdvertConfirmed, savedRemovalConfirmed,
  savedMutationFailed,
} from '@entities/advert/model/likedAdvertsSlice';
import { deleteLikeThunk, setLikeThunk } from '@entities/like/model/likesThunk';

const canMutate = (state: SavedState, id: number): boolean =>
  state.status === SavedStatus.Ready && !state.pending[id];

export const saveAdvertThunk = createAsyncThunk<LikedAdvert, AdvertType, { state: SavedRoot }>(
  'likedAdverts/save',
  async (advert, { dispatch, requestId }) => {
    const request = { advertId: advert.id, requestId };
    dispatch(savedMutationStarted(request));
    try {
      const like = await dispatch(setLikeThunk(advert.id)).unwrap();
      const item = { ...like, Advert: advert };
      dispatch(savedAdvertConfirmed({ ...request, item }));
      return item;
    } catch (error) {
      dispatch(savedMutationFailed({ ...request, error: 'Не удалось сохранить объявление.' }));
      throw error;
    }
  },
  { condition: (advert, { getState }) => canMutate(getState().likedAdverts, advert.id) },
);

export const removeSavedAdvertThunk = createAsyncThunk<number, number, { state: SavedRoot }>(
  'likedAdverts/remove',
  async (advertId, { dispatch, requestId }) => {
    const request = { advertId, requestId };
    dispatch(savedMutationStarted(request));
    try {
      const result = await dispatch(deleteLikeThunk(advertId)).unwrap();
      if (result.advertId !== advertId) throw new Error('Unexpected advert ID');
      dispatch(savedRemovalConfirmed(request));
      return result.advertId;
    } catch (error) {
      dispatch(savedMutationFailed({ ...request, error: 'Не удалось удалить объявление из избранного.' }));
      throw error;
    }
  },
  { condition: (id, { getState }) => canMutate(getState().likedAdverts, id) },
);
