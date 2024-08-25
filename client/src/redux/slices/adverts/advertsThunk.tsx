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
