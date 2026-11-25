import { configureStore } from '@reduxjs/toolkit';
import { afterEach, expect, it, vi } from 'vitest';
import { CanceledError } from 'axios';
import { listingService } from '../api/listingService';
import listingReducer from './listingSlice';
import { getListingByIdThunk, getFilteredListingsThunk } from './listingThunk';
import { ListingDetailStatus, type Listing } from './listingModel';
import { selectSearchHasMore } from './listingSelectors';

const filters = {
  city: '',
  district: '',
  metro: '',
  priceFrom: 0,
  priceTo: 0,
  roomsFrom: 0,
  roomsTo: 0,
  tags: [],
};
const advert: Listing = {
  id: 7,
  title: 'Комната',
  body: null,
  price: 100,
  userId: 4,
  floor: null,
  rooms: null,
  square: null,
  createdAt: '',
  updatedAt: '',
  user: null,
  location: null,
};

afterEach(() => {
  vi.restoreAllMocks();
});

it('aborts search transport and retains confirmed results without an error', async () => {
  const store = configureStore({ reducer: { listing: listingReducer } });
  const get = vi
    .spyOn(listingService, 'getFilteredListingsPage')
    .mockResolvedValueOnce({ items: [advert], total: 9, page: 1, limit: 8 })
    .mockImplementationOnce(
      () =>
        new Promise(() => {
          /* Pending until its owner cancels. */
        }),
    );
  await store.dispatch(getFilteredListingsThunk({ filters, searchKey: '', page: 1, limit: 8 }));
  const request = store.dispatch(
    getFilteredListingsThunk({ filters, searchKey: '', page: 2, limit: 8 }),
  );
  const signal = get.mock.calls[1][3]?.signal;
  request.abort();
  expect((await request).meta.requestStatus).toBe('rejected');
  expect(signal?.aborted).toBe(true);
  expect(store.getState().listing.search).toMatchObject({
    items: [advert],
    loading: false,
    loadingMore: false,
    loadMoreError: null,
    page: 1,
    error: null,
    requestId: null,
  });
});

it('blocks parallel pages, keeps cards on error and retries the same page', async () => {
  const store = configureStore({ reducer: { listing: listingReducer } });
  let rejectNext!: (error: Error) => void;
  const get = vi
    .spyOn(listingService, 'getFilteredListingsPage')
    .mockResolvedValueOnce({ items: [advert], total: 9, page: 1, limit: 8 })
    .mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectNext = reject;
      }),
    )
    .mockResolvedValueOnce({ items: [{ ...advert, id: 8 }], total: 9, page: 2, limit: 8 });
  const first = { filters, searchKey: '', page: 1, limit: 8 };
  const next = { ...first, page: 2 };
  await store.dispatch(getFilteredListingsThunk(first));
  const pending = store.dispatch(getFilteredListingsThunk(next));
  await store.dispatch(getFilteredListingsThunk(next));
  expect(get).toHaveBeenCalledTimes(2);
  expect(store.getState().listing.search).toMatchObject({
    items: [advert],
    loading: false,
    loadingMore: true,
    page: 1,
    total: 9,
  });
  rejectNext(new Error('offline'));
  await pending;
  expect(store.getState().listing.search).toMatchObject({
    items: [advert],
    page: 1,
    error: null,
    loadingMore: false,
    loadMoreError: 'Не удалось загрузить следующие объявления.',
  });
  await store.dispatch(getFilteredListingsThunk(next));
  expect(store.getState().listing.search.items.map(({ id }) => id)).toEqual([7, 8]);
  expect(get.mock.calls.map(([, page]) => page)).toEqual([1, 2, 2]);
  expect(selectSearchHasMore(store.getState())).toBe(false);
});

it('advances duplicate-only pages by server metadata and stops at the final page', async () => {
  const store = configureStore({ reducer: { listing: listingReducer } });
  const items = [advert, { ...advert, id: 8 }];
  const get = vi
    .spyOn(listingService, 'getFilteredListingsPage')
    .mockResolvedValueOnce({ items, total: 5, page: 1, limit: 2 })
    .mockResolvedValueOnce({ items, total: 5, page: 2, limit: 2 })
    .mockResolvedValueOnce({ items: [{ ...advert, id: 9 }], total: 5, page: 3, limit: 2 });
  const request = { filters, searchKey: '', page: 1, limit: 2 };
  await store.dispatch(getFilteredListingsThunk(request));
  await store.dispatch(getFilteredListingsThunk({ ...request, page: 2 }));
  expect(store.getState().listing.search.items).toHaveLength(2);
  expect(selectSearchHasMore(store.getState())).toBe(true);
  await store.dispatch(getFilteredListingsThunk({ ...request, page: 3 }));
  expect(store.getState().listing.search.items.map(({ id }) => id)).toEqual([7, 8, 9]);
  expect(selectSearchHasMore(store.getState())).toBe(false);
  await store.dispatch(getFilteredListingsThunk({ ...request, page: 4 }));
  expect(get).toHaveBeenCalledTimes(3);
});

it('ignores a late page and failure from the previous filters, even without transport cancellation', async () => {
  const store = configureStore({ reducer: { listing: listingReducer } });
  let resolveNext!: (page: {
    items: Listing[];
    total: number;
    page: number;
    limit: number;
  }) => void;
  const get = vi
    .spyOn(listingService, 'getFilteredListingsPage')
    .mockResolvedValueOnce({ items: [advert], total: 9, page: 1, limit: 8 })
    .mockReturnValueOnce(
      new Promise((resolve) => {
        resolveNext = resolve;
      }),
    )
    .mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 8 });
  const first = { filters, searchKey: '', page: 1, limit: 8 };
  const next = { ...first, page: 2 };
  await store.dispatch(getFilteredListingsThunk(first));
  const pending = store.dispatch(getFilteredListingsThunk(next));
  await store.dispatch(
    getFilteredListingsThunk({
      ...first,
      searchKey: 'city=Казань',
      filters: { ...filters, city: 'Казань' },
    }),
  );
  resolveNext({ items: [advert], total: 9, page: 2, limit: 8 });
  await pending;
  store.dispatch(getFilteredListingsThunk.rejected(new Error('offline'), pending.requestId, next));
  expect(store.getState().listing.search).toMatchObject({
    items: [],
    total: 0,
    page: 1,
    searchKey: 'city=Казань',
    error: null,
    loadMoreError: null,
  });
  await store.dispatch(getFilteredListingsThunk(next));
  expect(get).toHaveBeenCalledTimes(3);
});

it('keeps a confirmed detail on a canceled reload and never treats cancel as NotFound', async () => {
  const store = configureStore({ reducer: { listing: listingReducer } });
  vi.spyOn(listingService, 'getListingById')
    .mockResolvedValueOnce(advert)
    .mockRejectedValueOnce(new CanceledError('canceled'))
    .mockImplementationOnce(
      () =>
        new Promise(() => {
          /* Pending until its owner cancels. */
        }),
    );
  await store.dispatch(getListingByIdThunk(advert.id));
  await store.dispatch(getListingByIdThunk(advert.id));
  expect(store.getState().listing).toMatchObject({
    chosenListing: advert,
    detailStatus: ListingDetailStatus.Ready,
  });
  const request = store.dispatch(getListingByIdThunk(8));
  request.abort();
  await request;
  expect(store.getState().listing).toMatchObject({
    chosenListing: null,
    detailStatus: ListingDetailStatus.Idle,
    detailRequestId: null,
  });
});
