import { createAsyncThunk } from '@reduxjs/toolkit';
import { listingService } from '@entities/listing/api/listingService';

export const postAdvertThunk = createAsyncThunk('adverts/postAdvert', (data: FormData) =>
  listingService.createListing(data),
);
