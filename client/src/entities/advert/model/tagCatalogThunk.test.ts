import { configureStore } from '@reduxjs/toolkit';
import { expect, it, vi } from 'vitest';
import advertService from '../api/advertService';
import { ListingCondition, TagCatalogState } from './tag-catalog';
import type { TagType } from './advertsModel';
import { getTagCatalogOrigin, TAG_CATALOG_TTL_MS } from './tagCatalogModel';
import tagCatalogReducer from './tagCatalogSlice';
import { getTagCatalogThunk } from './tagCatalogThunk';
import { isTagCatalogFresh, selectTagCatalogEntry } from './tagCatalogSelectors';

const tags: TagType[] = Object.values(ListingCondition).map((name, index) => ({
  id: index + 1,
  name,
}));
const origin = getTagCatalogOrigin();
const request = { origin };
it('uses the five-minute TTL from successful completion and reload bypasses it', async () => {
  let now = 1000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  const get = vi.spyOn(advertService, 'getTagsBySearch').mockResolvedValue(tags);
  const store = configureStore({ reducer: { tagCatalog: tagCatalogReducer } });
  await store.dispatch(getTagCatalogThunk(request));
  now += TAG_CATALOG_TTL_MS - 1;
  await store.dispatch(getTagCatalogThunk(request));
  expect(get).toHaveBeenCalledOnce();
  now += 1;
  await store.dispatch(getTagCatalogThunk(request));
  expect(get).toHaveBeenCalledTimes(2);
  expect(selectTagCatalogEntry(store.getState(), origin).fetchedAt).toBe(now);
  await store.dispatch(getTagCatalogThunk({ origin, force: true }));
  expect(get).toHaveBeenCalledTimes(3);
});

it('timestamps a slow successful response at completion rather than dispatch', async () => {
  let now = 1000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  let finish!: (value: TagType[]) => void;
  vi.spyOn(advertService, 'getTagsBySearch').mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const store = configureStore({ reducer: { tagCatalog: tagCatalogReducer } });
  const pending = store.dispatch(getTagCatalogThunk(request));
  now += TAG_CATALOG_TTL_MS;
  finish(tags);
  await pending;
  const entry = selectTagCatalogEntry(store.getState(), origin);
  expect(entry.fetchedAt).toBe(now);
  expect(isTagCatalogFresh(entry, now)).toBe(true);
});

it('keeps the last success on network and validation failures and retries without waiting for TTL', async () => {
  const get = vi
    .spyOn(advertService, 'getTagsBySearch')
    .mockResolvedValueOnce(tags)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce(tags);
  const store = configureStore({ reducer: { tagCatalog: tagCatalogReducer } });
  await store.dispatch(getTagCatalogThunk(request));
  const success = selectTagCatalogEntry(store.getState(), origin);
  await store.dispatch(getTagCatalogThunk({ origin, force: true }));
  expect(selectTagCatalogEntry(store.getState(), origin)).toMatchObject({
    tags,
    fetchedAt: success.fetchedAt,
    state: TagCatalogState.Error,
    invalidated: true,
  });
  await store.dispatch(getTagCatalogThunk(request));
  const failed = selectTagCatalogEntry(store.getState(), origin);
  expect(failed.tags).toBe(success.tags);
  expect(failed.error).toContain('отсутствуют условия');
  expect(failed.fetchedAt).toBe(success.fetchedAt);
  await store.dispatch(getTagCatalogThunk(request));
  expect(get).toHaveBeenCalledTimes(4);
  expect(selectTagCatalogEntry(store.getState(), origin).state).toBe(TagCatalogState.Ready);
});

it('does not cache cancellation as success and rejects the late response after a newer load', async () => {
  let finishOld!: (value: TagType[]) => void;
  const get = vi
    .spyOn(advertService, 'getTagsBySearch')
    .mockResolvedValueOnce(tags)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOld = resolve;
        }),
    )
    .mockResolvedValueOnce([...tags, { id: 99, name: 'Новое условие' }]);
  const store = configureStore({ reducer: { tagCatalog: tagCatalogReducer } });
  await store.dispatch(getTagCatalogThunk(request));
  const success = selectTagCatalogEntry(store.getState(), origin);
  const pending = store.dispatch(getTagCatalogThunk({ origin, force: true }));
  pending.abort();
  await pending;
  const canceled = selectTagCatalogEntry(store.getState(), origin);
  expect(get.mock.calls[1][1]?.signal?.aborted).toBe(true);
  expect(canceled).toMatchObject({
    tags,
    fetchedAt: success.fetchedAt,
    error: null,
    requestId: null,
    invalidated: true,
  });
  expect(isTagCatalogFresh(canceled, Date.now())).toBe(false);
  await store.dispatch(getTagCatalogThunk(request));
  finishOld([]);
  await Promise.resolve();
  expect(selectTagCatalogEntry(store.getState(), origin).tags).toHaveLength(5);
  expect(get).toHaveBeenCalledTimes(3);
});

it('keeps API origins isolated and does not fetch under a mismatched origin key', async () => {
  const other = { origin: 'https://other.example.invalid' };
  let state = tagCatalogReducer(undefined, getTagCatalogThunk.pending('other', other));
  state = tagCatalogReducer(
    state,
    getTagCatalogThunk.fulfilled({ tags, fetchedAt: Date.now() }, 'other', other),
  );
  const store = configureStore({
    reducer: { tagCatalog: tagCatalogReducer },
    preloadedState: { tagCatalog: state },
  });
  const get = vi.spyOn(advertService, 'getTagsBySearch').mockResolvedValue(tags);
  await store.dispatch(getTagCatalogThunk(other));
  expect(get).not.toHaveBeenCalled();
  await store.dispatch(getTagCatalogThunk(request));
  expect(get).toHaveBeenCalledOnce();
  expect(store.getState().tagCatalog.entries[other.origin]?.tags).toEqual(tags);
  expect(store.getState().tagCatalog.entries[origin]?.tags).toEqual(tags);
});

it('ignores stale success, error and cancellation without disturbing a newer request', () => {
  let state = tagCatalogReducer(undefined, getTagCatalogThunk.pending('old', request));
  state = tagCatalogReducer(state, getTagCatalogThunk.pending('new', request));
  state = tagCatalogReducer(state, getTagCatalogThunk.rejected(new Error('late'), 'old', request));
  state = tagCatalogReducer(
    state,
    getTagCatalogThunk.rejected(
      Object.assign(new Error('Aborted'), { name: 'AbortError' }),
      'old',
      request,
    ),
  );
  state = tagCatalogReducer(
    state,
    getTagCatalogThunk.fulfilled({ tags, fetchedAt: 1 }, 'old', request),
  );
  expect(state.entries[origin]).toMatchObject({
    requestId: 'new',
    state: TagCatalogState.Loading,
    fetchedAt: null,
  });
});

it('keeps an aborted first load stale and allows an immediate retry', async () => {
  const get = vi
    .spyOn(advertService, 'getTagsBySearch')
    .mockImplementationOnce(
      () =>
        new Promise(() => {
          /* Canceled by the cache owner. */
        }),
    )
    .mockResolvedValueOnce(tags);
  const store = configureStore({ reducer: { tagCatalog: tagCatalogReducer } });
  const pending = store.dispatch(getTagCatalogThunk(request));
  pending.abort();
  await pending;
  const entry = selectTagCatalogEntry(store.getState(), origin);
  expect(entry).toMatchObject({
    tags: [],
    fetchedAt: null,
    error: null,
    requestId: null,
    invalidated: true,
  });
  expect(isTagCatalogFresh(entry, Date.now())).toBe(false);
  await store.dispatch(getTagCatalogThunk(request));
  expect(get).toHaveBeenCalledTimes(2);
  expect(selectTagCatalogEntry(store.getState(), origin).state).toBe(TagCatalogState.Ready);
});
