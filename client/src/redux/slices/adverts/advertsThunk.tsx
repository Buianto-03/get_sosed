import { createAsyncThunk } from '@reduxjs/toolkit';
import advertService from '../../../services/advertService';

export const getAdvertsThunk = createAsyncThunk('adverts/getAdvertsThunk', () =>
  advertService.getAdverts(),
);

export const a = 1;
