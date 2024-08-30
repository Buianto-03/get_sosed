import { createAsyncThunk } from '@reduxjs/toolkit';
import advertService from '../../../services/advertService';
import type { FilterType, TagType } from '../../../types/advert';

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

export const postAdvertThunk = createAsyncThunk('adverts/postAdvertThunk', async (data: FormData) =>
  advertService.createAdvert(data),
);
export const getTagsBySearchThunk = createAsyncThunk(
  'adverts/getTagsBySearch',
  async (tags: string) => advertService.getTagsBySearch(tags),
);

export const getLikedAdvertsThunk = createAsyncThunk('adverts/getLikedAdverts', async () =>
  advertService.getLikedAdverts(),
);

export const getTopAdvertsThunk = createAsyncThunk('adverts/getTopAdverts', async () =>
  advertService.getTopAdverts(),
);
