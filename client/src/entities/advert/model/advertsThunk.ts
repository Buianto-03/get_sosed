import { isAxiosError } from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { isRequestCanceled } from '@shared/api/cancellation';
import advertService from '../api/advertService';
import type { AdvertType, FilterType, TagType } from './advertsModel';

export const getAdvertsThunk = createAsyncThunk('adverts/getAdvertsThunk', (_, { signal }) =>
  advertService.getAdverts({ signal }),
);
export const getFilteredAdvertsThunk = createAsyncThunk(
  'adverts/getFilteredAdverts',
  async (filters: FilterType & { tags: TagType[] }, { signal }) =>
    advertService.getFilteredAdverts(filters, { signal }),
);

export const getAdvertByIdThunk = createAsyncThunk<AdvertType, number, { rejectValue: number }>(
  'adverts/getAdvertByIdThunk',
  async (id, { rejectWithValue, signal }) => {
    try {
      return await advertService.getAdvertById(id, { signal });
    } catch (error) {
      if (isRequestCanceled(error)) {
        throw error;
      }
      return rejectWithValue(isAxiosError(error) ? error.response?.status ?? 500 : 500);
    }
  },
);

export const getTopAdvertsThunk = createAsyncThunk('adverts/getTopAdverts', async (_, { signal }) =>
  advertService.getTopAdverts({ signal }),
);
