/* eslint-disable react/jsx-props-no-spreading */
import React, { type PropsWithChildren } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { listingService } from '@entities/listing/api/listingService';
import { type Listing, likedListingsReducer, getLikedListingsThunk } from '@entities/listing/model';
import likeService from '@entities/like/api/likeService';
import likesReducer from '@entities/like/model/likesSlice';
import authReducer, { setSession } from '@entities/session/model/authSlice';
import { ProfileListingsSection } from './ProfileListingsSection';

const advert: Listing = {
  id: 1,
  title: 'Комната',
  price: 20000,
  userId: 1,
  body: null,
  floor: null,
  rooms: null,
  square: null,
  createdAt: '',
  updatedAt: '',
  user: null,
  location: null,
};
const props = {
  headingId: 'favorites',
  title: 'Избранное',
  emptyState: { title: 'Пусто', description: 'Добавьте объявление', icon: null, action: null },
  onOpenListing: vi.fn(),
};
const collection = {
  items: [advert],
  total: 1,
  loading: false,
  error: null,
  onRetry: vi.fn(),
};

async function prepareStore(): Promise<(props: PropsWithChildren) => JSX.Element> {
  const store = configureStore({
    reducer: { auth: authReducer, likedListings: likedListingsReducer, likes: likesReducer },
  });
  store.dispatch(
    setSession({ accessToken: 'token', user: { id: 1, name: 'User', email: 'a@b.c', roleId: 1 } }),
  );
  vi.spyOn(listingService, 'getLikedListings').mockResolvedValue([
    { id: 2, advertId: advert.id, userId: 1, Advert: advert },
  ]);
  await store.dispatch(getLikedListingsThunk()).unwrap();

  return function Wrapper({ children }: PropsWithChildren): JSX.Element {
    return (
      <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    );
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

it('returns focus to the collection heading when the focused favorite is removed', async () => {
  const wrapper = await prepareStore();
  const { rerender } = render(<ProfileListingsSection {...props} collection={collection} />, {
    wrapper,
  });
  act(() => screen.getByRole('button', { name: 'Убрать из избранного' }).focus());
  rerender(
    <ProfileListingsSection {...props} collection={{ ...collection, items: [], total: 0 }} />,
  );
  expect(screen.getByRole('heading', { name: 'Избранное' })).toHaveFocus();
  expect(screen.getByText('Пусто')).toBeInTheDocument();
});

it('preserves focus outside the collection when a previously focused favorite is removed', async () => {
  const wrapper = await prepareStore();
  const { rerender } = render(
    <>
      <button type="button">Другое действие</button>
      <ProfileListingsSection {...props} collection={collection} />
    </>,
    { wrapper },
  );
  act(() => screen.getByRole('button', { name: 'Убрать из избранного' }).focus());
  const outsideAction = screen.getByRole('button', { name: 'Другое действие' });
  act(() => outsideAction.focus());

  rerender(
    <>
      <button type="button">Другое действие</button>
      <ProfileListingsSection {...props} collection={{ ...collection, items: [], total: 0 }} />
    </>,
  );
  expect(outsideAction).toHaveFocus();
});

it('shares pending and error states between matching cards in both collections', async () => {
  const wrapper = await prepareStore();
  const deleteLike = vi
    .spyOn(likeService, 'deleteLike')
    .mockRejectedValueOnce(new Error('offline'));
  render(
    <>
      <ProfileListingsSection {...props} collection={collection} />
      <ProfileListingsSection
        {...props}
        headingId="my-listings"
        title="Мои"
        collection={collection}
      />
    </>,
    { wrapper },
  );
  const favorites = within(screen.getByRole('region', { name: 'Избранное' }));
  const mine = within(screen.getByRole('region', { name: 'Мои' }));
  const favoriteSave = favorites.getByRole('button', { name: 'Убрать из избранного' });
  const mySave = mine.getByRole('button', { name: 'Убрать из избранного' });
  fireEvent.click(favoriteSave);
  expect(favoriteSave).toBeDisabled();
  expect(mySave).toBeDisabled();
  expect(deleteLike).toHaveBeenCalledTimes(1);
  expect(deleteLike).toHaveBeenCalledWith(advert.id);
  expect(await favorites.findByRole('alert')).toHaveTextContent('Не удалось удалить объявление');
  expect(mine.getByRole('alert')).toHaveTextContent('Не удалось удалить объявление');
  expect(favoriteSave).toBeEnabled();
  expect(mySave).toBeEnabled();
});
