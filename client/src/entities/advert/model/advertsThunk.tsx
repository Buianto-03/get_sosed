import { createAsyncThunk } from '@reduxjs/toolkit';
import advertService from '../api/advertService';
import type { FilterType, TagType } from './advert';

export const getAdvertsThunk = createAsyncThunk('adverts/getAdvertsThunk', () =>
  advertService.getAdverts(),
);
export const getFilteredAdvertsThunk = createAsyncThunk(
  'adverts/getFilteredAdverts',
  async (filters: FilterType & { tags: TagType[] }) => advertService.getFilteredAdverts(filters),
);

export const getAdvertByIdThunk = createAsyncThunk(
  'adverts/getAdvertByIdThunk',
  async (id: number) => advertService.getAdvertById(id),
);

export const getTopAdvertsThunk = createAsyncThunk('adverts/getTopAdverts', async () =>
  advertService.getTopAdverts(),
);
