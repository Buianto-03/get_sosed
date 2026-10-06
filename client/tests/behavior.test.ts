import test from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError } from 'axios';
import axiosInstance, { configureApiAuth } from '../src/shared/api/client';
import { readFilters, writeFilters } from '../src/features/advert-filter/model/filters';
import authReducer from '../src/entities/session/model/authSlice';
import { UserStatus } from '../src/entities/session/model/auth';
import { setSession, clearAuth } from '../src/entities/session/model/authSlice';
import likesReducer from '../src/entities/like/model/likesSlice';
import { deleteLikeThunk, setLikeThunk } from '../src/entities/like/model/likesThunk';
import advertReducer from '../src/entities/advert/model/advertsSlice';
import { getFilteredAdvertsThunk } from '../src/entities/advert/model/advertsThunk';
import chatReducer, { addMessage, setMessages } from '../src/entities/chat/model/chatListSlice';
import { incomingMessageSchema } from '../src/entities/chat/model/protocol';

test('session accepts login and clears user on logout', () => {
  const user = { id: 1, name: 'Test', email: 'test@example.com', roleId: 1 };
  const logged = authReducer(undefined, setSession({ accessToken: 'token', user }));
  assert.equal(logged.user.status, UserStatus.Logged);
  assert.equal(logged.accessToken, 'token');
  const guest = authReducer(logged, clearAuth());
  assert.equal(guest.user.status, UserStatus.Guest);
  assert.equal(guest.accessToken, '');
});

test('HTTP client retries a 403 with one refreshed token', async () => {
  let attempts = 0;
  let refreshes = 0;
  let token = 'expired';
  const originalAdapter = axiosInstance.defaults.adapter;
  configureApiAuth({
    getAccessToken: () => token,
    refreshAccessToken: async () => {
      refreshes += 1;
      await new Promise((resolve) => setTimeout(resolve, 1));
      token = 'fresh';
      return token;
    },
    onUnauthorized: () => { throw new Error('unexpected authorization failure'); },
  });
  axiosInstance.defaults.adapter = async (config) => {
    attempts += 1;
    if (config.headers.Authorization !== 'Bearer fresh') {
      const response = { data: {}, status: 403, statusText: 'Forbidden', headers: {}, config };
      throw new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, undefined, response);
    }
    return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
  };
  try {
    const responses = await Promise.all([
      axiosInstance.get('/protected'),
      axiosInstance.get('/protected'),
    ]);
    assert.ok(responses.every((response) => response.data.ok === true));
    assert.equal(attempts, 4);
    assert.equal(refreshes, 1);
  } finally {
    axiosInstance.defaults.adapter = originalAdapter;
  }
});

test('filters round trip through URL and preserve unrelated params', () => {
  const initial = new URLSearchParams('sort=new&city=Белград&tags=2,4&priceFrom=100');
  const filters = readFilters(initial);
  assert.deepEqual(filters.tagIds, [2, 4]);
  const next = writeFilters(initial, { ...filters, city: 'Нови Сад', tagIds: [4] });
  assert.equal(next.get('sort'), 'new');
  assert.equal(next.get('tags'), '4');
  assert.equal(readFilters(next).city, 'Нови Сад');
  assert.equal(readFilters(initial).city, 'Белград');
  assert.deepEqual(readFilters(new URLSearchParams('tags=bad,-2,3&priceFrom=NaN')).tagIds, [3]);
});

test('likes update after add and delete actions', () => {
  const like = { id: 5, userId: 1, advertId: 7 };
  const added = likesReducer(undefined, setLikeThunk.fulfilled(like, 'request', 7));
  assert.deepEqual(added.likes.map((item) => item.id), [5]);
  const deleted = likesReducer(added, deleteLikeThunk.fulfilled(like, 'request', 7));
  assert.deepEqual(deleted.likes, []);
});

test('older filtered advert responses cannot replace newer results', () => {
  const filters = { city: '', district: '', metro: '', priceFrom: 0, priceTo: 0, roomsFrom: 0, roomsTo: 0, tags: [] };
  const first = advertReducer(undefined, getFilteredAdvertsThunk.pending('old', filters));
  const second = advertReducer(first, getFilteredAdvertsThunk.pending('new', filters));
  const stale = advertReducer(second, getFilteredAdvertsThunk.fulfilled([], 'old', filters));
  assert.equal(stale.loading, true);
  assert.equal(stale.filterRequestId, 'new');
  const latest = advertReducer(stale, getFilteredAdvertsThunk.fulfilled([], 'new', filters));
  assert.equal(latest.loading, false);
});

test('chat history stays with the addressed dialog', () => {
  const event = incomingMessageSchema.parse({ type: 'SET_MESSAGES', receiverId: 2, payload: [] });
  assert.equal(event.type, 'SET_MESSAGES');
  const message = { id: 10, senderId: 2, receiverId: 1, message: 'Привет' };
  const withHistory = chatReducer(undefined, setMessages({ receiverId: 2, messages: [message] }));
  const withReply = chatReducer(withHistory, addMessage({ userId: 2, message: { ...message, id: 11 } }));
  assert.equal(withReply.messagesByUser[2].length, 2);
  assert.equal(withReply.messagesByUser[3], undefined);
});
