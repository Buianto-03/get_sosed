import { describe, expect, it } from 'vitest';
import type { ChatType } from './chat';
import { ChatStatus, type ChatListType } from './chatListModel';
import {
  selectChatConnection,
  selectChatHistory,
  selectChatHistoryStatus,
  selectChatListError,
  selectChatListStatus,
  selectChatRows,
} from './chatListSelectors';
import chatReducer, {
  addMessage,
  clearChat,
  historyStarted,
  setChatConnection,
  setMessages,
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
  it('inserts late IDs in order, appends new IDs and preserves unrelated histories and rows', () => {
    const latest = row(20);
    const neighbor = row(15, 3);
    const activeMessages = [message(10), latest];
    const neighborMessages = [neighbor];
    let state = chatReducer(undefined, addMessage({ userId: 2, message: latest }));
    state = chatReducer(state, addMessage({ userId: 3, message: neighbor }));
    state = chatReducer(state, setMessages({ receiverId: 2, messages: activeMessages }));
    const before = state;

    const late = message(14);
    state = chatReducer(state, addMessage({ userId: 2, message: late }));
    expect(state.chatList).toBe(before.chatList);
    expect(state.messagesByUser[3]).toEqual(neighborMessages);
    expect(state.messagesByUser[3]).toBe(before.messagesByUser[3]);
    expect(state.messagesByUser[2][0]).toBe(before.messagesByUser[2][0]);
    expect(state.messagesByUser[2][1]).toBe(late);
    expect(state.messagesByUser[2][2]).toBe(latest);

    const reply = message(21, 1, 2);
    state = chatReducer(state, addMessage({ userId: 2, message: reply }));
    expect(state.messagesByUser[2].map(({ id }) => id)).toEqual([10, 14, 20, 21]);
    expect(state.chatList[0]).toEqual({
      ...reply,
      sender: latest.receiver,
      receiver: latest.sender,
    });
    expect(state.chatList[1]).toBe(before.chatList[1]);
    expect(state.messagesByUser[3]).toBe(before.messagesByUser[3]);
  });

  it('merges an out-of-order SET_MESSAGES snapshot with newer live data for the addressed dialog', () => {
    const live = row(15);
    const otherState = chatReducer(undefined, addMessage({ userId: 2, message: live }));
    const older = message(8, 3);
    const event = incomingMessageSchema.parse({
      type: 'SET_MESSAGES',
      receiverId: 3,
      payload: [message(12, 3), { ...older, message: 'Старая версия' }, older],
    });
    if (event.type !== 'SET_MESSAGES') {
      throw new Error('Expected SET_MESSAGES');
    }
    const withNeighbor = chatReducer(
      otherState,
      setMessages({ receiverId: event.receiverId, messages: event.payload }),
    );
    expect(withNeighbor.messagesByUser[2]).toBe(otherState.messagesByUser[2]);
    expect(withNeighbor.messagesByUser[3]).toEqual([older, message(12, 3)]);
    const activeSnapshot = [message(12), row(9), row(12)];
    const merged = chatReducer(
      withNeighbor,
      setMessages({ receiverId: 2, messages: activeSnapshot }),
    );
    expect(merged.messagesByUser[2]).toEqual([activeSnapshot[1], activeSnapshot[2], live]);
    expect(merged.messagesByUser[2][2]).toBe(live);
    expect(merged.messagesByUser[3]).toBe(withNeighbor.messagesByUser[3]);
    expect(merged.chatList).toBe(withNeighbor.chatList);
    expect(selectChatHistoryStatus({ chatList: merged }, 2)).toBe(ChatStatus.Ready);

    const replay = chatReducer(
      merged,
      setMessages({ receiverId: 2, messages: structuredClone(activeSnapshot) }),
    );
    expect(replay).toBe(merged);
  });

  it('preserves identities on ADD/NEW replay and uses participants arriving later to create the row', () => {
    const sparse = message(11);
    const initial = chatReducer(undefined, addMessage({ userId: 2, message: sparse }));
    expect(initial.chatList).toEqual([]);
    const enriched = row(sparse.id);
    const ready = chatReducer(initial, addMessage({ userId: 2, message: enriched }));
    expect(ready.chatList).toEqual([enriched]);
    expect(ready.messagesByUser[2]).toBe(initial.messagesByUser[2]);

    ['ADD_MESSAGE', 'NEW_MESSAGE'].forEach((type) => {
      const event = incomingMessageSchema.parse({ type, payload: enriched });
      if (event.type !== 'ADD_MESSAGE' && event.type !== 'NEW_MESSAGE') {
        throw new Error('Expected a live message');
      }
      expect(chatReducer(ready, addMessage({ userId: 2, message: event.payload }))).toBe(ready);
    });
    expect(chatReducer(ready, addMessage({ userId: 2, message: sparse }))).toBe(ready);
    const withPhoto = {
      ...enriched,
      sender: { ...enriched.sender, UserProfile: { photo: 'avatar.jpg' } },
    };
    const updated = chatReducer(ready, addMessage({ userId: 2, message: withPhoto }));
    expect(updated.chatList).toEqual([withPhoto]);
    expect(updated.messagesByUser[2]).toBe(ready.messagesByUser[2]);
  });
});

describe('chat list and selectors', () => {
  it('merges a late list with newer live rows and keeps the list stable on an equivalent refresh', () => {
    const pending = chatReducer(undefined, getReceiverListThunk.pending('request', 1));
    const live = row(14);
    const withLive = chatReducer(pending, addMessage({ userId: 2, message: live }));
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

  it('keeps selected histories stable on presence and unrelated history changes', () => {
    const withHistory = chatReducer(
      undefined,
      setMessages({ receiverId: 2, messages: [message(7)] }),
    );
    const online = chatReducer(withHistory, setOnline([{ id: 2, name: 'Собеседник' }]));
    const connected = chatReducer(online, setChatConnection(true));
    const loading = chatReducer(connected, historyStarted(3));
    const disconnected = chatReducer(loading, setChatConnection(false));

    const before = { chatList: withHistory };
    const after = { chatList: disconnected };
    expect(selectChatConnection({ chatList: loading })).toBe(true);
    expect(selectChatConnection(after)).toBe(false);
    expect(selectChatRows(after)).toBe(selectChatRows(before));
    expect(selectChatHistory(after, 2)).toBe(selectChatHistory(before, 2));
    expect(selectChatHistory(after, 3)).toBe(selectChatHistory(before, 4));
    expect(selectChatHistoryStatus(after, 2)).toBe(ChatStatus.Ready);
    expect(selectChatHistoryStatus(after, 3)).toBe(ChatStatus.Error);
    expect(selectChatHistoryStatus(after, 4)).toBe(ChatStatus.Idle);
    expect(selectChatListStatus(after)).toBe(ChatStatus.Idle);
    expect(selectChatListError(after)).toBeNull();
  });

  it('clears histories, rows and connection and ignores a previous session’s late list', () => {
    const pending = chatReducer(undefined, getReceiverListThunk.pending('old', 1));
    const withLive = chatReducer(pending, addMessage({ userId: 2, message: row(8) }));
    const cleared = chatReducer(withLive, clearChat());
    expect(cleared.messagesByUser).toEqual({});
    expect(cleared.chatList).toEqual([]);
    expect(cleared.connected).toBe(false);
    const nextSession = chatReducer(cleared, getReceiverListThunk.pending('new', 3));
    const stale = chatReducer(nextSession, getReceiverListThunk.fulfilled([row(8)], 'old', 1));
    expect(stale).toBe(nextSession);
    expect(stale.requestId).toBe('new');
    expect(stale.status).toBe(ChatStatus.Loading);
  });
});
