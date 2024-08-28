import { createAsyncThunk } from '@reduxjs/toolkit';
import advertService from '../../../services/advertService';
import type { FilterType } from '../../../types/advert';

export const getAdvertsThunk = createAsyncThunk('adverts/getAdvertsThunk', () =>
  advertService.getAdverts(),
);
export const getFilteredAdvertsThunk = createAsyncThunk(
  'adverts/getFilteredAdverts',
  async (filters: FilterType) => advertService.getFilteredAdverts(filters),
);

export const getAdvertByIdThunk = createAsyncThunk(
  'adverts/getAdvertByIdThunk',
  async (id: number) => advertService.getAdvertById(id),
);
export const getTagsBySearchThunk = createAsyncThunk<string[], string>(
  'adverts/getTagsBySearch',
  async (tags: string) => advertService.getTagsBySearch(tags), 
);

export const getLikedAdvertsThunk = createAsyncThunk(
  'adverts/getLikedAdverts',
  async () => advertService.getLikedAdverts(),
);
