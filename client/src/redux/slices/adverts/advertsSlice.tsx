import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import {
  getAdvertByIdThunk,
  getAdvertsThunk,
  getFilteredAdvertsThunk,
  getLikedAdvertsThunk,
  getTagsBySearchThunk,
  getTopAdvertsThunk,
} from './advertsThunk';
import type { AdvertSliceT, AdvertType, FilterType } from '../../../types/advert';
import { deleteLikeThunk } from '../likes/likesThunk';

const initialState: AdvertSliceT = {
  adverts: [],
  visitableCards: 8,
  query: '',
  chosenAdvert: null,
  filters: {
    priceFrom: 0,
    priceTo: 400000,
    city: '',
    district: '',
    metro: '',
    category: '',
  },
  tags: [],
  liked: [],
  populars: [],
  pickedTags: [],
};

export const advertSlice = createSlice({
  name: 'advert',
  initialState,
  reducers: {
    loadCards: (state) => {
      state.visitableCards += 8;
    },
    setAdverts: (state, action: PayloadAction<AdvertType[]>) => {
      state.adverts = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setFilters: (state, action: PayloadAction<FilterType>) => {
      state.filters = action.payload;
    },
    setTags: (state, action: PayloadAction<string[]>) => {
      state.tags = action.payload;
    },
    addTag: (state, action: PayloadAction<string>) => {
      if (!state.pickedTags.includes(action.payload)) {
        state.pickedTags.push(action.payload);
      }
    },
    removeTag(state, action: PayloadAction<string>) {
      state.pickedTags = state.pickedTags.filter((tag) => tag.id !== action.payload);
    },
    // addTag, removeTag
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAdvertsThunk.fulfilled, (state, action) => {
        state.adverts = action.payload;
      })
      .addCase(getFilteredAdvertsThunk.fulfilled, (state, action) => {
        state.adverts = action.payload;
      })
      .addCase(getAdvertByIdThunk.fulfilled, (state, action) => {
        state.chosenAdvert = action.payload;
      })
      .addCase(getTagsBySearchThunk.fulfilled, (state, action) => {
        state.tags = action.payload;
      })
      .addCase(getLikedAdvertsThunk.fulfilled, (state, action) => {
        state.liked = action.payload;
      })
      .addCase(deleteLikeThunk.fulfilled, (state, action) => {
        state.liked.filter((el) => el.id !== action.payload.id)
      })
      .addCase(getTopAdvertsThunk.fulfilled, (state, action) => {
        state.populars = action.payload;
      });
  },
});
export const {
  loadCards,
  setAdverts,
  setSearchQuery,
  setFilters,
  setTags,
  addTag,
  removeTag,
} = advertSlice.actions;

export default advertSlice.reducer;
