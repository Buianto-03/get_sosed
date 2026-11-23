import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SearchRoute from '@pages/search/ui/search-route/SearchRoute';
import ListingRoute from '@pages/advert-details/ui/listing-route/ListingRoute';
import advertService from '@entities/advert/api/advertService';
import type { AdvertPageType, AdvertType } from '@entities/advert/model/advertsModel';
import likeService from '@entities/like/api/likeService';
import { clearAuth } from '@entities/session/model/authSlice';
import { store } from '../store/store';

const advert: AdvertType = {
  id: 7,
  title: 'Актуальная комната',
  body: 'Описание',
  price: 100,
  userId: 2,
  floor: null,
  rooms: null,
  square: null,
  createdAt: '',
  updatedAt: '',
  user: null,
  location: null,
};
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function open(path: string): ReturnType<typeof render> {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Link to="/listings?city=Москва">Москва</Link>
        <Link to="/listings?city=Казань">Казань</Link>
        <Link to="/listings/8">Другая комната</Link>
        <Link to="/elsewhere">Уйти</Link>
        <Routes>
          <Route path="/listings" element={<SearchRoute />} />
          <Route path="/listings/:listingId" element={<ListingRoute />} />
          <Route path="*" element={<p>Другая страница</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}
beforeEach(() => {
  store.dispatch(clearAuth());
  vi.spyOn(advertService, 'getTagsBySearch').mockResolvedValue([
    { id: 1, name: 'Для некурящих' },
    { id: 2, name: 'Питомцы разрешены' },
    { id: 3, name: 'Тихие вечера' },
    { id: 4, name: 'С рабочим местом' },
  ]);
  vi.spyOn(likeService, 'getLikesByAdvertId').mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  store.dispatch(clearAuth());
  vi.restoreAllMocks();
});

it('aborts superseded search requests and keeps the latest result after late responses', async () => {
  const first = deferred<AdvertPageType>();
  const second = deferred<AdvertPageType>();
  const latest = deferred<AdvertPageType>();
  const get = vi
    .spyOn(advertService, 'getFilteredAdvertsPage')
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)
    .mockReturnValueOnce(latest.promise);
  const view = open('/listings');
  fireEvent.click(screen.getByRole('link', { name: 'Москва' }));
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  expect(get.mock.calls[0][3]?.signal?.aborted).toBe(true);
  fireEvent.click(screen.getByRole('link', { name: 'Казань' }));
  await waitFor(() => expect(get).toHaveBeenCalledTimes(3));
  expect(get.mock.calls[1][3]?.signal?.aborted).toBe(true);
  expect(get.mock.calls[2][3]?.signal?.aborted).toBe(false);
  await act(async () => {
    latest.resolve({ items: [advert], total: 1, page: 1, limit: 8 });
  });
  expect(await screen.findByRole('heading', { name: advert.title ?? '' })).toBeInTheDocument();
  await act(async () => {
    first.resolve({ items: [], total: 0, page: 1, limit: 8 });
    second.resolve({ items: [], total: 0, page: 1, limit: 8 });
  });
  expect(screen.getByRole('heading', { name: advert.title ?? '' })).toBeInTheDocument();
  expect(store.getState().advert.search.error).toBeNull();
  view.unmount();
  // Completed requests are released by the route; only in-flight work needs abort.
  expect(get.mock.calls[2][3]?.signal?.aborted).toBe(false);
});

it('aborts detail and interested-people reads when the ID changes and the page unmounts', async () => {
  const first = deferred<AdvertType>();
  const latest = deferred<AdvertType>();
  const get = vi
    .spyOn(advertService, 'getAdvertById')
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(latest.promise);
  const likes = vi.spyOn(likeService, 'getLikesByAdvertId').mockImplementation(
    () =>
      new Promise(() => {
        /* Pending until its owner cancels. */
      }),
  );
  open('/listings/7');
  fireEvent.click(screen.getByRole('link', { name: 'Другая комната' }));
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  expect(get.mock.calls[0][1]?.signal?.aborted).toBe(true);
  expect(likes.mock.calls[0][1]?.signal?.aborted).toBe(true);
  await act(async () => {
    latest.resolve({ ...advert, id: 8 });
  });
  expect(await screen.findByRole('heading', { name: advert.title ?? '' })).toBeInTheDocument();
  await act(async () => {
    first.resolve({ ...advert, title: 'Старое объявление' });
  });
  expect(screen.queryByRole('heading', { name: 'Старое объявление' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Уйти' }));
  expect(get.mock.calls[1][1]?.signal?.aborted).toBe(true);
  expect(likes.mock.calls[1][1]?.signal?.aborted).toBe(true);
  expect(await screen.findByText('Другая страница')).toBeInTheDocument();
  expect(store.getState().advert.detailRequestId).toBeNull();
});
