import { configureStore, type Dispatch } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import chatList, {
  addMessage,
  chatSendFailed,
  clearChat,
  closeHistory,
  historyFailed,
  historyReceived,
  loadOlderHistory,
  openHistory,
  retryHistory,
  setChatConnection,
} from '@entities/chat/model/chatListSlice';
import type { ChatType } from '@entities/chat/model/chat';
import type { DialogHistory } from '@entities/chat/model/chatListModel';
import type { HistoryPageRequest } from '@entities/chat/model/protocol';
import { chatSocket } from '@entities/chat/model/socket';
import { chatHistoryListener } from './chat-history-listener';

const dialog = { ownerId: 1, receiverId: 2 };
const message = (id: number): ChatType => ({ id, receiverId: 1, senderId: 2, message: String(id) });

interface TestHistory {
  dispatch: Dispatch;
  history: () => DialogHistory | null;
  pending: () => HistoryPageRequest;
  receive: (request: HistoryPageRequest, ids: number[], nextCursor?: number | null) => void;
  live: (id: number) => void;
  send: MockInstance<[HistoryPageRequest], boolean>;
}

function setup(): TestHistory {
  const send = vi.spyOn(chatSocket, 'requestHistoryPage').mockReturnValue(true);
  const store = configureStore({
    reducer: { chatList },
    middleware: (defaults) => defaults().prepend(chatHistoryListener.middleware),
  });
  const { dispatch } = store;
  const history: TestHistory['history'] = () => store.getState().chatList.history;
  const pending = (): HistoryPageRequest => {
    const request = history()?.pending;
    if (!request) {
      throw new Error('Expected a pending history request');
    }
    return request;
  };
  const receive: TestHistory['receive'] = (request, ids, nextCursor = null) =>
    dispatch(
      historyReceived({
        type: 'HISTORY_PAGE',
        receiverId: request.receiverId,
        requestId: request.requestId,
        payload: ids.map(message),
        nextCursor,
        hasMore: nextCursor !== null,
      }),
    );
  const live: TestHistory['live'] = (id) =>
    dispatch(addMessage({ ownerId: 1, message: message(id) }));
  dispatch(openHistory(dialog));
  dispatch(setChatConnection(true));
  return { dispatch, history, pending, receive, live, send };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('paged history requests', () => {
  it('retains live and visible history on failure, retries the failed cursor once and ignores stale replies', () => {
    const { dispatch, history, pending, receive, live, send } = setup();
    const initial = pending();
    expect(initial).toMatchObject({ receiverId: 2, limit: 50 });
    expect(initial.beforeId).toBeUndefined();
    expect(initial.afterId).toBeUndefined();
    live(55);
    dispatch(historyFailed({ ...initial, receiverId: 3 }));
    expect(pending()).toBe(initial);
    dispatch(historyFailed(initial));
    expect(history()?.messages.map(({ id }) => id)).toEqual([55]);
    dispatch(retryHistory(dialog));
    const retry = pending();
    expect(retry.requestId).not.toBe(initial.requestId);
    receive(initial, [30]);
    expect(pending()).toBe(retry);
    receive(retry, [50, 51], 50);
    dispatch(loadOlderHistory(dialog));
    const older = pending();
    expect(older.beforeId).toBe(50);
    dispatch(loadOlderHistory(dialog));
    dispatch(chatSendFailed(dialog));
    expect(history()?.sendFailed).toBe(true);
    expect(pending()).toBe(older);
    dispatch(historyFailed(older));
    dispatch(retryHistory(dialog));
    const olderRetry = pending();
    expect(olderRetry.beforeId).toBe(50);
    expect(olderRetry.requestId).not.toBe(older.requestId);
    receive(older, [42]);
    dispatch(historyFailed(older));
    expect(pending()).toBe(olderRetry);
    receive(olderRetry, [40, 41]);
    dispatch(loadOlderHistory(dialog));
    expect(history()?.messages.map(({ id }) => id)).toEqual([40, 41, 50, 51, 55]);
    expect(history()?.pending).toBeNull();
    expect(history()?.beforeCursor).toBeNull();
    expect(send).toHaveBeenCalledTimes(4);
  });

  it.each([0, 10])(
    'recovers after ID %i despite racing live events, a repeated disconnect and catch-up retry',
    (cutoff) => {
      const { dispatch, history, pending, receive, live } = setup();
      receive(pending(), cutoff ? [cutoff] : [], cutoff || null);
      dispatch(setChatConnection(false));
      dispatch(setChatConnection(true));
      const first = pending();
      expect(first.afterId).toBe(cutoff);
      live(150);
      receive(first, [20, 40], 40);
      const second = pending();
      expect(second.afterId).toBe(40);
      live(45);
      dispatch(setChatConnection(false));
      dispatch(setChatConnection(true));
      const restart = pending();
      expect(restart.afterId).toBe(40);
      receive(second, [45, 49], 49);
      dispatch(historyFailed(restart));
      dispatch(retryHistory(dialog));
      const retry = pending();
      expect(retry.afterId).toBe(40);
      receive(retry, [45, 50, 150]);
      expect(history()?.pending).toBeNull();
      expect(history()?.afterCursor).toBeNull();
      expect(history()?.beforeCursor).toBe(cutoff || null);
      expect(history()?.messages.map(({ id }) => id)).toEqual([
        ...(cutoff ? [10] : []),
        20,
        40,
        45,
        50,
        150,
      ]);
    },
  );

  it('waits for a confirmed initial page, releases inactive rows and rejects earlier owners and visits', () => {
    const { dispatch, history, pending, receive, live } = setup();
    live(100);
    const old = pending();
    dispatch(setChatConnection(false));
    dispatch(setChatConnection(true));
    expect(pending().afterId).toBeUndefined();
    dispatch(closeHistory(dialog));
    live(105);
    expect(history()).toBeNull();
    dispatch(openHistory({ ...dialog, receiverId: 3 }));
    const neighbor = pending();
    receive(old, [2, 100]);
    expect(pending()).toBe(neighbor);
    dispatch(closeHistory(dialog));
    expect(pending()).toBe(neighbor);
    dispatch(openHistory(dialog));
    const reopened = pending();
    receive(old, [100]);
    receive(neighbor, []);
    expect(pending()).toBe(reopened);
    dispatch(clearChat());
    dispatch(setChatConnection(true));
    dispatch(openHistory({ ...dialog, ownerId: 3 }));
    const newOwner = pending();
    dispatch(historyFailed(reopened));
    receive(reopened, [22]);
    expect(history()?.messages).toEqual([]);
    expect(pending()).toBe(newOwner);
    receive(newOwner, [22]); // Payload belongs to owner 1 despite the matching envelope.
    expect(history()?.failed).toBe(newOwner);
    expect(history()?.messages).toEqual([]);
  });

  it('recovers from a transport write failure and rejects a non-advancing boundary', () => {
    const { dispatch, history, pending, receive, send } = setup();
    receive(pending(), [17], 17);
    send.mockReturnValueOnce(false);
    dispatch(loadOlderHistory(dialog));
    expect(history()?.failed?.beforeId).toBe(17);
    dispatch(retryHistory(dialog));
    const retry = pending();
    receive(retry, [17], 17);
    expect(history()?.failed).toBe(retry);
    expect(history()?.messages.map(({ id }) => id)).toEqual([17]);
  });
});
