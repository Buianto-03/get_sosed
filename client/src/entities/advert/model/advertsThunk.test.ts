import { configureStore } from '@reduxjs/toolkit';
import { afterEach, expect, it, vi } from 'vitest';
import { CanceledError } from 'axios';
import advertService from '../api/advertService';
import advertReducer from './advertsSlice';
import { getAdvertByIdThunk, getFilteredAdvertsThunk } from './advertsThunk';
import { AdvertDetailStatus, type AdvertType } from './advertsModel';

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
const advert: AdvertType = {
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
  const store = configureStore({ reducer: { advert: advertReducer } });
  const get = vi
    .spyOn(advertService, 'getFilteredAdverts')
    .mockResolvedValueOnce([advert])
    .mockImplementationOnce(
      () =>
        new Promise(() => {
          /* Pending until its owner cancels. */
        }),
    );
  await store.dispatch(getFilteredAdvertsThunk(filters));
  const request = store.dispatch(getFilteredAdvertsThunk(filters));
  const signal = get.mock.calls[1][1]?.signal;
  request.abort();
  expect((await request).meta.requestStatus).toBe('rejected');
  expect(signal?.aborted).toBe(true);
  expect(store.getState().advert).toMatchObject({
    adverts: [advert],
    loading: false,
    error: null,
    filterRequestId: null,
  });
});

it('keeps a confirmed detail on a canceled reload and never treats cancel as NotFound', async () => {
  const store = configureStore({ reducer: { advert: advertReducer } });
  vi.spyOn(advertService, 'getAdvertById')
    .mockResolvedValueOnce(advert)
    .mockRejectedValueOnce(new CanceledError('canceled'))
    .mockImplementationOnce(
      () =>
        new Promise(() => {
          /* Pending until its owner cancels. */
        }),
    );
  await store.dispatch(getAdvertByIdThunk(advert.id));
  await store.dispatch(getAdvertByIdThunk(advert.id));
  expect(store.getState().advert).toMatchObject({
    chosenAdvert: advert,
    detailStatus: AdvertDetailStatus.Ready,
  });
  const request = store.dispatch(getAdvertByIdThunk(8));
  request.abort();
  await request;
  expect(store.getState().advert).toMatchObject({
    chosenAdvert: null,
    detailStatus: AdvertDetailStatus.Idle,
    detailRequestId: null,
  });
});
