import { createAsyncThunk } from '@reduxjs/toolkit';
import { listingService } from '@entities/listing/api/listingService';

export const postListingThunk = createAsyncThunk('listings/postListing', (data: FormData) =>
  listingService.createListing(data),
);
