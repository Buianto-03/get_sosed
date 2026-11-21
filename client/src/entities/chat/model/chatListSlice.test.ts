import { describe, expect, it } from 'vitest';
import type { ChatType } from './chat';
import { ChatStatus, type ChatListType } from './chatListModel';
import {
  selectChatConnection,
  selectChatHistory,
  selectChatListError,
  selectChatListStatus,
  selectChatRows,
} from './chatListSelectors';
import chatReducer, {
  addMessage,
  clearChat,
  openHistory,
  historyStarted,
  historyReceived,
  setChatConnection,
  setOnline,
} from './chatListSlice';
import { getReceiverListThunk } from './chatListThunk';
import { incomingMessageSchema } from './protocol';

function message(id: number, senderId = 2, receiverId = 1): ChatType {
  return { id, senderId, receiverId, message: `Сообщение ${id}` };
}

function row(id: number, senderId = 2, receiverId = 1): ChatListType {
  return {
    ...message(id, senderId, receiverId),
    sender: { id: senderId, name: `Пользователь ${senderId}` },
    receiver: { id: receiverId, name: `Пользователь ${receiverId}` },
  };
}

describe('chat history', () => {
  it('merges pages and live events in order, preserves references for duplicates and ignores inactive history', () => {
    const latest = row(20);
    const neighbor = row(15, 3);
    const opened = chatReducer(undefined, openHistory({ ownerId: 1, receiverId: 2 }));
    let state = chatReducer(opened, addMessage({ ownerId: 1, message: latest }));
    state = chatReducer(state, historyStarted({ receiverId: 2, requestId: 'a', limit: 50 }));
    state = chatReducer(
      state,
      historyReceived({
        type: 'HISTORY_PAGE',
        receiverId: 2,
        requestId: 'a',
        payload: [message(10), { ...latest }],
        hasMore: true,
        nextCursor: 10,
      }),
    );
    expect(state.history?.messages).toEqual([message(10), latest]);
    expect(state.history?.messages[1]).toBe(latest);
    const before = state;
    state = chatReducer(state, addMessage({ ownerId: 1, message: neighbor }));
    expect(state.history).toBe(before.history);
    const rows = state.chatList;
    state = chatReducer(state, addMessage({ ownerId: 1, message: message(14) }));
    expect(state.chatList).toBe(rows);
    const reply = message(21, 1, 2);
    state = chatReducer(state, addMessage({ ownerId: 1, message: reply }));
    expect(state.history?.messages.map(({ id }) => id)).toEqual([10, 14, 20, 21]);
    expect(state.chatList[0]).toEqual({
      ...reply,
      sender: latest.receiver,
      receiver: latest.sender,
    });
    expect(state.chatList[1]).toBe(rows[1]);
  });

  it('preserves identities on ADD/NEW replay and uses participants arriving later to create the row', () => {
    const sparse = message(11);
    const opened = chatReducer(undefined, openHistory({ ownerId: 1, receiverId: 2 }));
    const initial = chatReducer(opened, addMessage({ ownerId: 1, message: sparse }));
    expect(initial.chatList).toEqual([]);
    const enriched = row(sparse.id);
    const ready = chatReducer(initial, addMessage({ ownerId: 1, message: enriched }));
    expect(ready.chatList).toEqual([enriched]);
    expect(ready.history?.messages).toBe(initial.history?.messages);

    ['ADD_MESSAGE', 'NEW_MESSAGE'].forEach((type) => {
      const event = incomingMessageSchema.parse({ type, payload: enriched });
      if (event.type !== 'ADD_MESSAGE' && event.type !== 'NEW_MESSAGE') {
        throw new Error('Expected a live message');
      }
      expect(chatReducer(ready, addMessage({ ownerId: 1, message: event.payload }))).toBe(ready);
    });
    expect(chatReducer(ready, addMessage({ ownerId: 1, message: sparse }))).toBe(ready);
    const withPhoto = {
      ...enriched,
      sender: { ...enriched.sender, UserProfile: { photo: 'avatar.jpg' } },
    };
    const updated = chatReducer(ready, addMessage({ ownerId: 1, message: withPhoto }));
    expect(updated.chatList).toEqual([withPhoto]);
    expect(updated.history?.messages).toBe(ready.history?.messages);
  });
});

describe('chat list and selectors', () => {
  it('merges a late list with newer live rows and keeps the list stable on an equivalent refresh', () => {
    const pending = chatReducer(undefined, getReceiverListThunk.pending('request', 1));
    const live = row(14);
    const withLive = chatReducer(pending, addMessage({ ownerId: 1, message: live }));
    const fromServer = row(11, 3);
    const loaded = chatReducer(
      withLive,
      getReceiverListThunk.fulfilled([fromServer, row(10)], 'request', 1),
    );
    expect(loaded.chatList).toEqual([live, fromServer]);
    expect(loaded.chatList[0]).toBe(withLive.chatList[0]);
    const reloading = chatReducer(loaded, getReceiverListThunk.pending('refresh', 1));
    const refreshed = chatReducer(
      reloading,
      getReceiverListThunk.fulfilled(
        [structuredClone(fromServer), structuredClone(live)],
        'refresh',
        1,
      ),
    );
    expect(refreshed.chatList).toBe(loaded.chatList);
  });

  it('keeps selected history stable on presence, rejects other addresses', () => {
    const opened = chatReducer(undefined, openHistory({ ownerId: 1, receiverId: 2 }));
    const online = chatReducer(opened, setOnline([{ id: 2, name: 'Собеседник' }]));
    const connected = chatReducer(online, setChatConnection(true));
    const before = { chatList: opened };
    const after = { chatList: connected };
    expect(selectChatConnection(after)).toBe(true);
    expect(selectChatRows(after)).toBe(selectChatRows(before));
    expect(selectChatHistory(after, 1, 2)).toBe(selectChatHistory(before, 1, 2));
    expect(selectChatHistory(after, 1, 3)).toBeNull();
    expect(selectChatHistory(after, 3, 2)).toBeNull();
    expect(selectChatListStatus(after)).toBe(ChatStatus.Idle);
    expect(selectChatListError(after)).toBeNull();
  });

  it('clears histories, rows and connection and ignores a previous session’s late list', () => {
    const pending = chatReducer(undefined, getReceiverListThunk.pending('old', 1));
    const withLive = chatReducer(pending, addMessage({ ownerId: 1, message: row(8) }));
    const cleared = chatReducer(withLive, clearChat());
    expect(cleared.history).toBeNull();
    expect(cleared.chatList).toEqual([]);
    expect(cleared.connected).toBe(false);
    const nextSession = chatReducer(cleared, getReceiverListThunk.pending('new', 3));
    const stale = chatReducer(nextSession, getReceiverListThunk.fulfilled([row(8)], 'old', 1));
    expect(stale).toBe(nextSession);
    expect(stale.requestId).toBe('new');
    expect(stale.status).toBe(ChatStatus.Loading);
  });
});
