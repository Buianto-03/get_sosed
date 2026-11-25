import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { listingService } from '@entities/listing/api/listingService';
import {
  type Listing,
  listingReducer,
  likedListingsReducer,
  getLikedListingsThunk,
} from '@entities/listing/model';
import likeService from '@entities/like/api/likeService';
import likesReducer from '@entities/like/model/likesSlice';
import authReducer, { setSession } from '@entities/session/model/authSlice';
import { removeSavedAdvertThunk } from '@features/liked-adverts/model';
import ListingRoute from './ListingRoute';

const advert: Listing = {
  id: 7,
  title: 'Комната',
  price: 20000,
  userId: 2,
  body: null,
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

it('keeps a listing focused on its own saved state and displays interested people', async () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      likedListings: likedListingsReducer,
      listing: listingReducer,
      likes: likesReducer,
    },
  });
  const anotherAdvert = { ...advert, id: 8 };
  store.dispatch(
    setSession({ accessToken: 'token', user: { id: 1, name: 'User', email: 'a@b.c', roleId: 1 } }),
  );
  vi.spyOn(listingService, 'getLikedListings').mockResolvedValue([
    { id: 15, advertId: advert.id, userId: 1, Advert: advert },
    { id: 16, advertId: anotherAdvert.id, userId: 1, Advert: anotherAdvert },
  ]);
  await store.dispatch(getLikedListingsThunk()).unwrap();
  vi.spyOn(listingService, 'getListingById').mockResolvedValue(advert);
  vi.spyOn(likeService, 'getLikesByAdvertId').mockResolvedValue([
    {
      id: 17,
      advertId: advert.id,
      userId: 3,
      User: { id: 3, name: 'Сосед', UserProfile: { photo: null, about: null, age: null } },
    },
  ]);
  vi.spyOn(likeService, 'deleteLike')
    .mockResolvedValueOnce({ advertId: anotherAdvert.id, deleted: true })
    .mockRejectedValue(new Error('offline'));
  const onRender = vi.fn();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/listings/7']}>
        <Routes>
          <Route
            path="/listings/:listingId"
            element={
              <React.Profiler id="listing" onRender={onRender}>
                <ListingRoute />
              </React.Profiler>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  expect(await screen.findByText('Сосед')).toBeInTheDocument();
  const save = screen.getByRole('button', { name: 'В избранном' });
  onRender.mockClear();
  await act(async () => {
    await store.dispatch(removeSavedAdvertThunk(anotherAdvert.id)).unwrap();
  });
  expect(onRender).not.toHaveBeenCalled();
  expect(save).toBeEnabled();

  fireEvent.click(save);
  expect(save).toBeDisabled();
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось удалить объявление');
  expect(save).toBeEnabled();
  expect(save).toHaveAttribute('aria-pressed', 'true');
});
