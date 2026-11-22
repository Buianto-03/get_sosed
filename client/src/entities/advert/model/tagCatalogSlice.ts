import { createSlice } from '@reduxjs/toolkit';
import { isRequestCanceled } from '@shared/api/cancellation';
import { TagCatalogState } from './tag-catalog';
import { emptyTagCatalogEntry } from './tagCatalogModel';
import type { TagCatalogCacheState } from './tagCatalogModel';
import { getTagCatalogThunk } from './tagCatalogThunk';

const initialState: TagCatalogCacheState = { entries: {} };

const tagCatalogSlice = createSlice({
  name: 'tagCatalog',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getTagCatalogThunk.pending, (state, action) => {
        const { origin } = action.meta.arg;
        const entry = state.entries[origin] ?? { ...emptyTagCatalogEntry };
        entry.state = TagCatalogState.Loading;
        entry.error = null;
        entry.requestId = action.meta.requestId;
        entry.invalidated = true;
        state.entries[origin] = entry;
      })
      .addCase(getTagCatalogThunk.fulfilled, (state, action) => {
        const entry = state.entries[action.meta.arg.origin];
        if (!entry || entry.requestId !== action.meta.requestId) {
          return;
        }
        entry.tags = action.payload.tags;
        entry.fetchedAt = action.payload.fetchedAt;
        entry.state = TagCatalogState.Ready;
        entry.error = null;
        entry.requestId = null;
        entry.invalidated = false;
      })
      .addCase(getTagCatalogThunk.rejected, (state, action) => {
        const entry = state.entries[action.meta.arg.origin];
        if (!entry || entry.requestId !== action.meta.requestId) {
          return;
        }
        const canceled = action.meta.aborted || isRequestCanceled(action.error);
        entry.state = canceled ? TagCatalogState.Ready : TagCatalogState.Error;
        entry.error = canceled
          ? null
          : action.payload ?? 'Не удалось загрузить условия проживания.';
        entry.requestId = null;
        entry.invalidated = true;
      });
  },
});

export default tagCatalogSlice.reducer;
