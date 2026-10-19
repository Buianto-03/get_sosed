import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { clearAuth } from '@entities/session/model/authSlice';
import type { AdvertType } from '@entities/advert/model/advertsModel';
import likeService from '@entities/like/api/likeService';
import { useSavedAdverts } from '@features/liked-adverts/model/use-saved-adverts';
import { store } from './store';

const advert: AdvertType = {
  id: 7,
  title: null,
  body: null,
  price: null,
  userId: null,
  floor: null,
  rooms: null,
  square: null,
  createdAt: '',
  updatedAt: '',
  user: null,
  location: null,
};
function GuestSave(): JSX.Element {
  const saved = useSavedAdverts();
  const location = useLocation();
  return (
    <>
      <button type="button" onClick={() => saved.toggle(advert)}>
        Сохранить
      </button>
      <output>{location.pathname + location.search}</output>
    </>
  );
}
afterEach(() => {
  vi.restoreAllMocks();
});
it('sends a guest to sign-in with the complete current address without a mutation', () => {
  store.dispatch(clearAuth());
  const post = vi.spyOn(likeService, 'setLike');
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/listings?city=Москва#results']}>
        <GuestSave />
      </MemoryRouter>
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  const address = screen.getByRole('status').textContent ?? '';
  const url = new URL(address, 'http://localhost');
  expect(url.pathname).toBe('/sign-in');
  expect(url.searchParams.get('returnTo')).toBe('/listings?city=Москва#results');
  expect(post).not.toHaveBeenCalled();
});
