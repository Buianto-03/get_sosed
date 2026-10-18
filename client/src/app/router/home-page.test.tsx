import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import HomeRoute from '@pages/welcome/ui/home-route/HomeRoute';
import AboutPage from '@pages/about/ui/about-page/AboutPage';
import advertService from '@entities/advert/api/advertService';
import type { AdvertType } from '@entities/advert/model/advertsModel';
import { clearAuth, setSession } from '@entities/session/model/authSlice';
import { SavedStatus } from '@entities/advert/model/likedAdvertsModel';
import axiosInstance from '@shared/api/client';
import likeService from '@entities/like/api/likeService';
import { store } from '../store/store';

const advert = (id: number): AdvertType => ({
  id,
  title: `Квартира ${id}`,
  body: null,
  price: null,
  userId: null,
  user: null,
  location: null,
  floor: null,
  rooms: null,
  square: null,
  AdvertPhotos: [],
  tags: [],
  createdAt: `2026-10-${10 + id}T00:00:00Z`,
  updatedAt: '',
});
function Location(): JSX.Element {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}
function open(about = false): ReturnType<typeof render> {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[about ? '/about' : '/']}>
        <Location />
        {about ? <AboutPage /> : <HomeRoute />}
      </MemoryRouter>
    </Provider>,
  );
}
beforeEach(() => {
  store.dispatch(clearAuth());
});
afterEach(() => {
  cleanup();
  store.dispatch(clearAuth());
  vi.restoreAllMocks();
});

it('shows only the three freshest real adverts, leaves search state alone and opens the actual ID', async () => {
  vi.spyOn(advertService, 'getAdverts').mockResolvedValue([
    advert(2),
    advert(4),
    advert(1),
    advert(3),
  ]);
  const previousSearch = store.getState().advert.adverts;
  open();
  const titles = await screen.findAllByRole('heading', { level: 3, name: /Квартира/ });
  expect(titles.map((item) => item.textContent)).toEqual([
    'Квартира 4',
    'Квартира 3',
    'Квартира 2',
  ]);
  expect(store.getState().advert.adverts).toBe(previousSearch);
  expect(screen.getAllByText('Цена не указана')).toHaveLength(3);
  expect(screen.getAllByText('Фото не добавлено')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Открыть объявление: Квартира 4' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/listings/4');
});

it('shows loading/error/retry/empty without hiding banner or explanation', async () => {
  let reject!: (error: Error) => void;
  const get = vi
    .spyOn(advertService, 'getAdverts')
    .mockReturnValueOnce(
      new Promise((_, fail) => {
        reject = fail;
      }),
    )
    .mockResolvedValue([]);
  open();
  expect(screen.getByRole('status', { name: 'Загружаем свежие объявления' })).toBeInTheDocument();
  expect(screen.queryByText('Подборка пока пуста')).not.toBeInTheDocument();
  await act(async () => {
    reject(new Error('offline'));
  });
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить свежие');
  expect(screen.queryByText('Подборка пока пуста')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
  expect(await screen.findByText('Подборка пока пуста')).toBeInTheDocument();
  expect(get).toHaveBeenCalledTimes(2);
  expect(screen.getByRole('heading', { name: 'Как это работает' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Разместить объявление' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/listings/new');
  fireEvent.click(screen.getByRole('button', { name: 'Найти жильё' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/listings');
});

it('sends guest saving to sign-in and does not post a like', async () => {
  vi.spyOn(advertService, 'getAdverts').mockResolvedValue([advert(7)]);
  const post = vi.spyOn(likeService, 'setLike');
  open();
  fireEvent.click(await screen.findByRole('button', { name: 'Сохранить объявление' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/sign-in?returnTo=%2F');
  expect(post).not.toHaveBeenCalled();
});

it('uses the shared saved state, blocks repeated save and preserves the heart on delete failure', async () => {
  vi.spyOn(axiosInstance, 'get').mockResolvedValue({ data: [] });
  store.dispatch(
    setSession({
      user: { id: 2, roleId: 2, name: 'Анна', email: 'anna@example.com' },
      accessToken: 'token',
    }),
  );
  await waitFor(() => expect(store.getState().likedAdverts.status).toBe(SavedStatus.Ready));
  vi.spyOn(advertService, 'getAdverts').mockResolvedValue([advert(7)]);
  let resolve!: (like: { id: number; userId: number; advertId: number }) => void;
  const post = vi.spyOn(likeService, 'setLike').mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  vi.spyOn(likeService, 'deleteLike').mockRejectedValue(new Error('offline'));
  open();
  const save = await screen.findByRole('button', { name: 'Сохранить объявление' });
  fireEvent.click(save);
  fireEvent.click(save);
  expect(save).toBeDisabled();
  expect(post).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve({ id: 1, userId: 2, advertId: 7 });
  });
  const remove = await screen.findByRole('button', { name: 'Убрать из избранного' });
  expect(remove).toHaveAttribute('aria-pressed', 'true');
  expect(store.getState().likedAdverts.items[0].Advert.id).toBe(7);
  fireEvent.click(remove);
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось удалить');
  expect(remove).toHaveAttribute('aria-pressed', 'true');
});

it('about opens listings through the real navigation callback', () => {
  open(true);
  expect(
    screen.getByRole('heading', { name: 'Комфортный дом начинается с людей' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Смотреть объявления' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/listings');
});
