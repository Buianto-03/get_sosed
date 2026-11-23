import { isAxiosError } from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { isRequestCanceled } from '@shared/api/cancellation';
import advertService from '../api/advertService';
import type { AdvertPageType, AdvertSearchRequest, AdvertSliceT, AdvertType } from './advertsModel';

export const getFilteredAdvertsThunk = createAsyncThunk<
  AdvertPageType,
  AdvertSearchRequest,
  { state: { advert: AdvertSliceT } }
>(
  'adverts/getFilteredAdverts',
  async ({ filters, page, limit }, { signal }) =>
    advertService.getFilteredAdvertsPage(filters, page, limit, { signal }),
  {
    condition: ({ searchKey, page, limit }, { getState }) => {
      if (page === 1) {
        return true;
      }
      const { search } = getState().advert;
      return (
        search.searchKey === searchKey &&
        search.requestId === null &&
        !search.loading &&
        !search.error &&
        search.page > 0 &&
        search.page + 1 === page &&
        search.limit === limit &&
        search.page * search.limit < search.total
      );
    },
  },
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
