import { isAxiosError } from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import advertService from '../api/advertService';
import type { AdvertType, FilterType, TagType } from './advertsModel';

export const getAdvertsThunk = createAsyncThunk('adverts/getAdvertsThunk', () =>
  advertService.getAdverts(),
);
export const getFilteredAdvertsThunk = createAsyncThunk(
  'adverts/getFilteredAdverts',
  async (filters: FilterType & { tags: TagType[] }) => advertService.getFilteredAdverts(filters),
);

export const getAdvertByIdThunk = createAsyncThunk<AdvertType, number, { rejectValue: number }>(
  'adverts/getAdvertByIdThunk',
  async (id, { rejectWithValue }) => {
    try {
      return await advertService.getAdvertById(id);
    } catch (error) {
      return rejectWithValue(isAxiosError(error) ? error.response?.status ?? 500 : 500);
    }
  },
);

export const getTopAdvertsThunk = createAsyncThunk('adverts/getTopAdverts', async () =>
  advertService.getTopAdverts(),
);
