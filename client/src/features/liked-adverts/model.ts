import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { z } from 'zod';
import axiosInstance from '@shared/api/client';
import { advertSchema } from '@entities/advert/model/advert';

const likedAdvertSchema = z.object({
  id: z.number(),
  advertId: z.number(),
  userId: z.number(),
  Advert: advertSchema,
});

export type LikedAdvert = z.infer<typeof likedAdvertSchema>;

export const getLikedAdvertsThunk = createAsyncThunk('likedAdverts/get', async () => {
  const response = await axiosInstance.get('/adverts/liked');
  return likedAdvertSchema.array().parse(response.data);
});

const likedAdvertsSlice = createSlice({
  name: 'likedAdverts',
  initialState: { items: [] as LikedAdvert[] },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getLikedAdvertsThunk.fulfilled, (state, action) => {
      state.items = action.payload;
    });
  },
});

export default likedAdvertsSlice.reducer;
