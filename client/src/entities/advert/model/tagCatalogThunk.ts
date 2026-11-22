import { createAsyncThunk } from '@reduxjs/toolkit';
import { isRequestCanceled } from '@shared/api/cancellation';
import advertService from '../api/advertService';
import { getTagCatalogView } from './tag-catalog';
import { getTagCatalogOrigin } from './tagCatalogModel';
import type { TagCatalogRequest, TagCatalogRoot, TagCatalogSuccess } from './tagCatalogModel';
import { isTagCatalogFresh, selectTagCatalogEntry } from './tagCatalogSelectors';

export const getTagCatalogThunk = createAsyncThunk<
  TagCatalogSuccess,
  TagCatalogRequest,
  { state: TagCatalogRoot; rejectValue: string }
>(
  'tagCatalog/get',
  async (_, { signal, rejectWithValue }) => {
    try {
      const tags = await advertService.getTagsBySearch('', { signal });
      const { error } = getTagCatalogView(tags);
      if (error) {
        return rejectWithValue(error);
      }
      return { tags, fetchedAt: Date.now() };
    } catch (error) {
      if (isRequestCanceled(error)) {
        throw error;
      }
      return rejectWithValue('Не удалось загрузить условия проживания.');
    }
  },
  {
    condition: ({ origin, force }, { getState }) => {
      if (origin !== getTagCatalogOrigin()) {
        return false;
      }
      const entry = selectTagCatalogEntry(getState(), origin);
      // An explicit reload bypasses TTL, but never duplicates an in-flight public read.
      return entry.requestId === null && (force === true || !isTagCatalogFresh(entry, Date.now()));
    },
  },
);
