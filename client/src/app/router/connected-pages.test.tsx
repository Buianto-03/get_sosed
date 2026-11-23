import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Link, MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi, type MockInstance } from 'vitest';
import SearchRoute from '@pages/search/ui/search-route/SearchRoute';
import ListingRoute from '@pages/advert-details/ui/listing-route/ListingRoute';
import ProfileRoute from '@pages/profile/ui/profile-route/ProfileRoute';
import ProfileEditRoute from '@pages/profile/ui/profile-edit-route/ProfileEditRoute';
import MessagesRoute from '@pages/chat/ui/messages-route/MessagesRoute';
import advertService from '@entities/advert/api/advertService';
import likeService from '@entities/like/api/likeService';
import chatService from '@entities/chat/api/chatListService';
import profileService from '@features/edit-profile/userProfileService';
import type { HistoryPageRequest } from '@entities/chat/model/protocol';
import { chatSocket } from '@entities/chat/model/socket';
import {
  historyReceived,
  addMessage,
  historyFailed,
  setChatConnection,
} from '@entities/chat/model/chatListSlice';
import { advertSchema, type AdvertPageType } from '@entities/advert/model/advertsModel';
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
function open(
  path: string,
  state?: object,
  navigation?: React.ReactNode,
): ReturnType<typeof render> {
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
        {navigation}
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
  vi.spyOn(advertService, 'getMine').mockResolvedValue({ items: [], total: 0, page: 1, limit: 12 });
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

function HistoryNavigation(): JSX.Element {
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => navigate(-1)}>
        Назад
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Вперёд
      </button>
    </>
  );
}

it('loads search pages on demand, retains cards on failure and retries the same page without duplicates', async () => {
  const first = Array.from({ length: 8 }, (_, index) => ({
    ...advert,
    id: 100 + index,
    title: `Результат ${index + 1}`,
  }));
  const get = vi
    .spyOn(advertService, 'getFilteredAdvertsPage')
    .mockResolvedValueOnce({ items: first, total: 10, page: 1, limit: 8 })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({
      items: [
        first[7],
        { ...advert, id: 108, title: 'Результат 9' },
        { ...advert, id: 109, title: 'Результат 10' },
      ],
      total: 10,
      page: 2,
      limit: 8,
    });
  open('/listings?city=Казань&tags=99');
  await screen.findByRole('heading', { name: 'Результат 8' });
  expect(
    within(screen.getByRole('region', { name: 'Объявления' })).getByRole('status'),
  ).toHaveTextContent('10 вариантов');
  expect(get).toHaveBeenCalledTimes(1);
  const more = screen.getByRole('button', { name: 'Показать ещё' });
  fireEvent.click(more);
  fireEvent.click(more);
  expect(get).toHaveBeenCalledTimes(2);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Не удалось загрузить следующие объявления',
  );
  expect(screen.getAllByRole('article')).toHaveLength(8);
  expect(screen.queryByText('Показаны предыдущие результаты поиска.')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Повторить загрузку' }));
  await screen.findByRole('heading', { name: 'Результат 10' });
  expect(screen.getAllByRole('article')).toHaveLength(10);
  expect(screen.queryByRole('button', { name: 'Показать ещё' })).not.toBeInTheDocument();
  expect(get.mock.calls.map(([, page, limit]) => [page, limit])).toEqual([
    [1, 8],
    [2, 8],
    [2, 8],
  ]);
  expect(get.mock.calls.every(([body]) => body.city === 'Казань' && body.tags[0].id === 99)).toBe(
    true,
  );
});

it('starts at page one with the URL filters on Back and Forward', async () => {
  const get = vi
    .spyOn(advertService, 'getFilteredAdvertsPage')
    .mockImplementation((filters, page = 1) =>
      Promise.resolve({ items: [{ ...advert, title: filters.city }], total: 1, page, limit: 8 }),
    );
  open(
    '/listings?city=Казань&tags=99',
    undefined,
    <>
      <Link to="/listings?city=Москва&priceFrom=10">Москва</Link>
      <HistoryNavigation />
    </>,
  );
  await screen.findByRole('heading', { name: 'Казань' });
  fireEvent.click(screen.getByRole('link', { name: 'Москва' }));
  await screen.findByRole('heading', { name: 'Москва' });
  fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
  await screen.findByRole('heading', { name: 'Казань' });
  expect(screen.getByRole('textbox', { name: 'Город' })).toHaveValue('Казань');
  expect(screen.getByRole('button', { name: '#99 ×' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Вперёд' }));
  await screen.findByRole('heading', { name: 'Москва' });
  expect(screen.getByRole('textbox', { name: 'Город' })).toHaveValue('Москва');
  expect(get.mock.calls.map(([body, page]) => [body.city, page])).toEqual([
    ['Казань', 1],
    ['Москва', 1],
    ['Казань', 1],
    ['Москва', 1],
  ]);
});

it('loads search from the URL only, keeps unknown tags and returns from details to the complete filter query', async () => {
  const get = vi.spyOn(advertService, 'getFilteredAdvertsPage').mockResolvedValue({
    items: [advert],
    total: 1,
    page: 1,
    limit: 8,
  });
  vi.spyOn(advertService, 'getAdvertById').mockResolvedValue(advert);
  open('/listings?city=Казань&priceFrom=10&roomsTo=4&tags=99');
  expect(await screen.findByRole('heading', { name: 'Квартира' })).toBeInTheDocument();
  expect(get.mock.calls[0][0]).toMatchObject({
    city: 'Казань',
    priceFrom: 10,
    roomsTo: 4,
    tags: [{ id: 99, name: '' }],
  });
  expect(get.mock.calls[0][3]?.signal).toBeInstanceOf(AbortSignal);
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
    .mockResolvedValue({ items: [advert], total: 1, page: 1, limit: 12 });
  open('/profile');
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Не удалось загрузить ваши объявления',
  );
  expect(screen.getByText('Пока нет сохранённых объявлений')).toBeInTheDocument();
  expect(screen.queryByText('Здесь будут ваши объявления')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
  expect(await screen.findByRole('heading', { name: 'Квартира' })).toBeInTheDocument();
});

it('loads more own adverts without duplicate requests or cards and retains the first page after an error', async () => {
  login();
  const first = Array.from({ length: 12 }, (_, index) => ({
    ...advert,
    id: 100 + index,
    title: `Моё объявление ${index + 1}`,
  }));
  const second = [
    first[11],
    { ...advert, id: 112, title: 'Моё объявление 13' },
    { ...advert, id: 113, title: 'Моё объявление 14' },
  ];
  const get = vi
    .spyOn(advertService, 'getMine')
    .mockResolvedValueOnce({ items: first, total: 14, page: 1, limit: 12 })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ items: second, total: 14, page: 2, limit: 12 });
  open('/profile');
  await screen.findByRole('heading', { name: 'Моё объявление 12' });
  const collection = within(screen.getByRole('region', { name: 'Мои объявления' }));
  expect(collection.getByText('14')).toBeInTheDocument();
  const more = collection.getByRole('button', { name: 'Показать ещё' });
  fireEvent.click(more);
  fireEvent.click(more);
  expect(get).toHaveBeenCalledTimes(2);
  expect(await collection.findByRole('alert')).toHaveTextContent(
    'Не удалось загрузить следующие объявления',
  );
  expect(collection.getAllByRole('heading', { name: /^Моё объявление/ })).toHaveLength(12);
  fireEvent.click(collection.getByRole('button', { name: 'Повторить загрузку' }));
  await collection.findByRole('heading', { name: 'Моё объявление 14' });
  expect(collection.getAllByRole('heading', { name: /^Моё объявление/ })).toHaveLength(14);
  expect(collection.queryByRole('button', { name: 'Показать ещё' })).not.toBeInTheDocument();
  expect(get.mock.calls.map(([page]) => page)).toEqual([1, 2, 2]);
});

it('ignores a late next-page response after the profile owner changes', async () => {
  login();
  const first = Array.from({ length: 12 }, (_, index) => ({
    ...advert,
    id: 100 + index,
    title: `Старое объявление ${index + 1}`,
  }));
  let resolveNext!: (page: AdvertPageType) => void;
  const pending = new Promise<AdvertPageType>((resolve) => {
    resolveNext = resolve;
  });
  const get = vi
    .spyOn(advertService, 'getMine')
    .mockResolvedValueOnce({ items: first, total: 13, page: 1, limit: 12 })
    .mockReturnValueOnce(pending)
    .mockResolvedValueOnce({
      items: [{ ...advert, id: 901, title: 'Объявление нового пользователя' }],
      total: 1,
      page: 1,
      limit: 12,
    });
  open('/profile');
  await screen.findByRole('heading', { name: 'Старое объявление 1' });
  fireEvent.click(screen.getByRole('button', { name: 'Показать ещё' }));
  act(() => {
    store.dispatch(setSession({ user: { ...user, id: 2 }, accessToken: 'new-token' }));
  });
  await screen.findByRole('heading', { name: 'Объявление нового пользователя' });
  expect(get.mock.calls[1][2]?.signal?.aborted).toBe(true);
  expect(get.mock.calls[2][2]?.signal?.aborted).toBe(false);
  expect(screen.queryByRole('heading', { name: 'Старое объявление 1' })).not.toBeInTheDocument();
  await act(async () => {
    resolveNext({
      items: [{ ...advert, id: 113, title: 'Позднее объявление' }],
      total: 13,
      page: 2,
      limit: 12,
    });
    await pending;
  });
  expect(screen.queryByRole('heading', { name: 'Позднее объявление' })).not.toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'Объявление нового пользователя' }),
  ).toBeInTheDocument();
  expect(get.mock.calls.map(([page]) => page)).toEqual([1, 2, 1]);
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

function connectChat(): MockInstance<[HistoryPageRequest], boolean> {
  const request = vi.spyOn(chatSocket, 'requestHistoryPage').mockReturnValue(true);
  store.dispatch(setChatConnection(true));
  return request;
}

function receiveFirstPage(hasMore = false): void {
  const request = store.getState().chatList.history?.pending;
  if (!request) {
    throw new Error('Expected a pending first page');
  }
  store.dispatch(
    historyReceived({
      ...request,
      type: 'HISTORY_PAGE',
      payload: hasMore ? [{ id: 15, senderId: 1, receiverId: 2, message: 'Сообщение' }] : [],
      hasMore,
      nextCursor: hasMore ? 15 : null,
    }),
  );
}

it('opens a first conversation without a fake listing and sends through the socket with a retained failed draft', async () => {
  login();
  vi.spyOn(chatService, 'getChatList').mockResolvedValue([]);
  vi.spyOn(chatService, 'getSummary').mockResolvedValue({ id: 2, name: 'Михаил' });
  const enter = connectChat();
  const send = vi.spyOn(chatSocket, 'sendMessage').mockReturnValueOnce(false).mockReturnValue(true);
  const view = open('/messages/2');
  await waitFor(() =>
    expect(enter).toHaveBeenCalledWith(expect.objectContaining({ receiverId: 2, limit: 50 })),
  );
  act(() => {
    receiveFirstPage();
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
  expect(store.getState().chatList.history?.messages).toEqual([]);
  act(() => {
    store.dispatch(
      addMessage({
        ownerId: 1,
        message: { id: 8, senderId: 1, receiverId: 2, message: 'Здравствуйте' },
      }),
    );
  });
  expect(screen.getAllByText('Здравствуйте')).toHaveLength(1);
  view.unmount();
  expect(store.getState().chatList.history).toBeNull();
});

it('changes listing context without reopening the dialog or refetching the summary on history retry', async () => {
  login();
  const list = vi.spyOn(chatService, 'getChatList').mockResolvedValue([]);
  const summary = vi.spyOn(chatService, 'getSummary').mockResolvedValue({ id: 2, name: 'Михаил' });
  const enter = connectChat();
  let resolveAdvert!: (value: typeof advert) => void;
  const pending = new Promise<typeof advert>((resolve) => {
    resolveAdvert = resolve;
  });
  const readAdvert = vi
    .spyOn(advertService, 'getAdvertById')
    .mockReturnValueOnce(pending)
    .mockResolvedValueOnce({ ...advert, id: 43, title: 'Действующее объявление' });

  const view = open(
    '/messages/2?listingId=42',
    undefined,
    <Link to="/messages/2?listingId=43">Сменить объявление</Link>,
  );
  await waitFor(() =>
    expect(enter).toHaveBeenCalledWith(expect.objectContaining({ receiverId: 2, limit: 50 })),
  );
  act(() => {
    receiveFirstPage(true);
  });
  const input = screen.getByRole('textbox', { name: 'Сообщение' });
  fireEvent.change(input, { target: { value: 'Черновик' } });
  fireEvent.click(screen.getByRole('link', { name: 'Сменить объявление' }));
  const thread = within(screen.getByRole('region', { name: 'Переписка' }));
  expect(await thread.findByRole('button', { name: /Действующее объявление/ })).toBeInTheDocument();
  await act(async () => {
    resolveAdvert({ ...advert, title: 'Устаревшее объявление' });
    await pending;
  });
  expect(thread.queryByText('Устаревшее объявление')).not.toBeInTheDocument();
  expect(input).toHaveValue('Черновик');
  expect(enter).toHaveBeenCalledTimes(1);

  expect(summary).toHaveBeenCalledTimes(1);

  fireEvent.click(thread.getByRole('button', { name: 'Загрузить предыдущие сообщения' }));
  act(() => {
    store.dispatch(historyFailed(enter.mock.calls[1][0]));
  });
  fireEvent.click(thread.getByRole('button', { name: 'Повторить загрузку переписки' }));
  expect(enter).toHaveBeenCalledTimes(3);
  expect(enter.mock.calls[2][0].beforeId).toBe(15);
  expect(summary).toHaveBeenCalledTimes(1);
  expect(readAdvert.mock.calls.map(([id]) => id)).toEqual([42, 43]);
  expect(readAdvert.mock.calls[0][1]?.signal?.aborted).toBe(true);
  expect(input).toHaveValue('Черновик');
  view.unmount();
  expect(summary.mock.calls[0][1]?.signal?.aborted).toBe(true);
  expect(readAdvert.mock.calls[1][1]?.signal?.aborted).toBe(true);
  expect(list.mock.calls[0][1]?.signal?.aborted).toBe(true);
});

it('discards a previous owner’s late summary when the receiver stays the same', async () => {
  login();
  vi.spyOn(chatService, 'getChatList').mockResolvedValue([]);
  let resolveSummary!: (value: { id: number; name: string }) => void;
  const pending = new Promise<{ id: number; name: string }>((resolve) => {
    resolveSummary = resolve;
  });
  const summary = vi
    .spyOn(chatService, 'getSummary')
    .mockReturnValueOnce(pending)
    .mockResolvedValueOnce({ id: 2, name: 'Текущий собеседник' });
  const enter = connectChat();

  open('/messages/2');
  act(() => {
    store.dispatch(setSession({ user: { ...user, id: 3 }, accessToken: 'new-token' }));
    store.dispatch(setChatConnection(true));
  });
  const thread = within(screen.getByRole('region', { name: 'Переписка' }));
  expect(await thread.findByText('Текущий собеседник')).toBeInTheDocument();
  await act(async () => {
    resolveSummary({ id: 2, name: 'Устаревший собеседник' });
    await pending;
  });
  expect(thread.queryByText('Устаревший собеседник')).not.toBeInTheDocument();
  expect(summary.mock.calls.map(([id]) => id)).toEqual([2, 2]);
  expect(summary.mock.calls[0][1]?.signal?.aborted).toBe(true);
  expect(enter.mock.calls).toEqual([[expect.objectContaining({ receiverId: 2 })]]);
});
