import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SearchRoute from '@pages/search/ui/search-route/SearchRoute';
import ListingRoute from '@pages/advert-details/ui/listing-route/ListingRoute';
import ProfileRoute from '@pages/profile/ui/profile-route/ProfileRoute';
import ProfileEditRoute from '@pages/profile/ui/profile-edit-route/ProfileEditRoute';
import MessagesRoute from '@pages/chat/ui/messages-route/MessagesRoute';
import advertService from '@entities/advert/api/advertService';
import likeService from '@entities/like/api/likeService';
import chatService from '@entities/chat/api/chatListService';
import profileService from '@features/edit-profile/userProfileService';
import { chatSocket } from '@entities/chat/model/socket';
import { setMessages, addMessage } from '@entities/chat/model/chatListSlice';
import { advertSchema } from '@entities/advert/model/advertsModel';
import { clearAuth, setSession } from '@entities/session/model/authSlice';
import axiosInstance from '@shared/api/client';
import { store } from '../store/store';

const user = {
  id: 1,
  roleId: 2,
  name: 'Анна',
  email: 'anna@example.com',
  UserProfile: {
    photo: null,
    city: 'Казань',
    intent: 'Ищу соседа',
    habits: ['Тишина'],
    about: 'Рассказываю о себе для будущих соседей',
    age: 27,
    gender: null,
    phoneNumber: '+70000000000',
  },
};
const advert = advertSchema.parse({
  id: 42,
  title: 'Квартира',
  body: 'Реальное описание',
  price: 25000,
  userId: 2,
  user: { id: 2, name: 'Михаил', email: 'm@example.com' },
  location: {
    id: 1,
    advertId: 42,
    city: 'Казань',
    district: null,
    address: 'Улица, 1',
    metro: null,
    coordinates: null,
  },
  square: 18,
  rooms: 2,
  floor: 3,
  createdAt: '2026-10-18T00:00:00Z',
  updatedAt: '',
  AdvertPhotos: [],
  tags: [],
});
function Location(): JSX.Element {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}
function open(path: string, state?: object): ReturnType<typeof render> {
  return render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: path.split('?')[0],
            search: path.includes('?') ? `?${path.split('?')[1]}` : '',
            state,
          },
        ]}
      >
        <Location />
        <Routes>
          <Route path="/listings" element={<SearchRoute />} />
          <Route path="/listings/:listingId" element={<ListingRoute />} />
          <Route path="/profile" element={<ProfileRoute />} />
          <Route path="/profile/edit" element={<ProfileEditRoute />} />
          <Route path="/messages" element={<MessagesRoute />} />
          <Route path="/messages/:receiverId" element={<MessagesRoute />} />
          <Route path="*" element={<div>Назначение</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}
beforeEach(() => {
  store.dispatch(clearAuth());
  vi.spyOn(axiosInstance, 'get').mockResolvedValue({ data: [] });
  vi.spyOn(advertService, 'getMine').mockResolvedValue([]);
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
const login = (): void => {
  store.dispatch(setSession({ user, accessToken: 'keep-token' }));
};

it('loads search from the URL only, keeps unknown tags and returns from details to the complete filter query', async () => {
  const get = vi.spyOn(advertService, 'getFilteredAdverts').mockResolvedValue([advert]);
  vi.spyOn(advertService, 'getAdvertById').mockResolvedValue(advert);
  open('/listings?city=Казань&priceFrom=10&roomsTo=4&tags=99');
  expect(await screen.findByRole('heading', { name: 'Квартира' })).toBeInTheDocument();
  expect(get).toHaveBeenCalledWith(
    expect.objectContaining({
      city: 'Казань',
      priceFrom: 10,
      roomsTo: 4,
      tags: [{ id: 99, name: '' }],
    }),
  );
  expect(screen.getByRole('button', { name: '#99 ×' })).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Город' }), { target: { value: 'Москва' } });
  expect(get).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Открыть объявление: Квартира' }));
  expect(await screen.findByText('Реальное описание')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'К результатам' }));
  await waitFor(() =>
    expect(screen.getByTestId('location')).toHaveTextContent('priceFrom=10&roomsTo=4&tags=99'),
  );
  expect(screen.getByRole('textbox', { name: 'Город' })).toHaveValue('Казань');
});

it('does not request invalid IDs and offers retry for failed detail reads', async () => {
  const get = vi
    .spyOn(advertService, 'getAdvertById')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue(advert);
  const invalid = open('/listings/invalid');
  expect(screen.getByRole('heading', { name: 'Объявление не найдено' })).toBeInTheDocument();
  expect(get).not.toHaveBeenCalled();
  invalid.unmount();
  open('/listings/42');
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить объявление');
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
  expect(await screen.findByText('Реальное описание')).toBeInTheDocument();
});

it('shows own-list errors independently from empty favorites and retries the profile collection', async () => {
  login();
  vi.spyOn(advertService, 'getMine')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue([advert]);
  open('/profile');
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Не удалось загрузить ваши объявления',
  );
  expect(screen.getByText('Пока нет сохранённых объявлений')).toBeInTheDocument();
  expect(screen.queryByText('Здесь будут ваши объявления')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
  expect(await screen.findByRole('heading', { name: 'Квартира' })).toBeInTheDocument();
});

it('keeps profile input on failure, updates the session from the API response and retains the access token', async () => {
  login();
  const patch = vi
    .spyOn(profileService, 'editUserProfile')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ ...user, name: 'Новое имя' });
  open('/profile/edit');
  fireEvent.change(screen.getByRole('textbox', { name: 'Имя' }), {
    target: { value: 'Новое имя' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось сохранить профиль');
  expect(screen.getByRole('textbox', { name: 'Имя' })).toHaveValue('Новое имя');
  const data = patch.mock.calls[0][0];
  expect(data.get('about')).toBe(user.UserProfile.about);
  expect(data.get('age')).toBe('27');
  expect(data.get('photo')).toBeNull();
  expect(data.get('removePhoto')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/profile'));
  expect(store.getState().auth.user).toMatchObject({ name: 'Новое имя' });
  expect(store.getState().auth.accessToken).toBe('keep-token');
});

it('opens a first conversation without a fake listing and sends through the socket with a retained failed draft', async () => {
  login();
  vi.spyOn(chatService, 'getChatList').mockResolvedValue([]);
  vi.spyOn(chatService, 'getSummary').mockResolvedValue({ id: 2, name: 'Михаил' });
  const enter = vi.spyOn(chatSocket, 'openDialog').mockImplementation(() => undefined);
  const leave = vi.spyOn(chatSocket, 'closeDialog').mockImplementation(() => undefined);
  const send = vi.spyOn(chatSocket, 'sendMessage').mockReturnValueOnce(false).mockReturnValue(true);
  const view = open('/messages/2');
  await waitFor(() => expect(enter).toHaveBeenCalledWith(2));
  act(() => {
    store.dispatch(setMessages({ receiverId: 2, messages: [] }));
  });
  expect(screen.queryByText('Объявление')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), {
    target: { value: 'Здравствуйте' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось отправить сообщение');
  expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('Здравствуйте');
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
  expect(send).toHaveBeenLastCalledWith(2, 'Здравствуйте');
  expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('');
  expect(store.getState().chatList.messagesByUser[2]).toEqual([]);
  act(() => {
    store.dispatch(
      addMessage({
        userId: 2,
        message: { id: 8, senderId: 1, receiverId: 2, message: 'Здравствуйте' },
      }),
    );
  });
  expect(screen.getAllByText('Здравствуйте')).toHaveLength(1);
  view.unmount();
  expect(leave).toHaveBeenCalledWith(2);
});
