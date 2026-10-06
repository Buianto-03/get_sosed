import { createAsyncThunk } from '@reduxjs/toolkit';
import advertService from '@entities/advert/api/advertService';

export const postAdvertThunk = createAsyncThunk('adverts/postAdvert', (data: FormData) =>
  advertService.createAdvert(data),
);
