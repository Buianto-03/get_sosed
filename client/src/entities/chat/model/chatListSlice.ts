import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  ChatStatus,
  type ChatListSlice,
  type ChatListType,
  type DialogAddress,
  type UserSummary,
} from './chatListModel';
import type { ChatType } from './chat';
import type { HistoryPage, HistoryPageRequest } from './protocol';
import { getReceiverListThunk } from './chatListThunk';

const initialState: ChatListSlice = {
  chatList: [],
  online: [],
  history: null,
  status: ChatStatus.Idle,
  error: null,
  requestId: null,
  connected: false,
};

function sameParticipant(left?: UserSummary, right?: UserSummary): boolean {
  return (
    left?.id === right?.id &&
    left?.name === right?.name &&
    left?.email === right?.email &&
    left?.UserProfile?.photo === right?.UserProfile?.photo
  );
}

function sameMessage(left: ChatType, right: ChatType): boolean {
  return (
    left.id === right.id &&
    left.senderId === right.senderId &&
    left.receiverId === right.receiverId &&
    left.message === right.message &&
    left.createdAt === right.createdAt &&
    sameParticipant(left.sender, right.sender) &&
    sameParticipant(left.receiver, right.receiver)
  );
}

function mergeHistory(current: ChatType[], incoming: ChatType[]): ChatType[] {
  if (!incoming.length) {
    return current;
  }
  const byId = new Map(current.map((message) => [message.id, message]));
  const latest = new Map(incoming.map((message) => [message.id, message]));
  let changed = false;
  latest.forEach((message, id) => {
    const existing = byId.get(id);
    if (!existing || !sameMessage(existing, message)) {
      byId.set(id, message);
      changed = true;
    }
  });
  return changed ? [...byId.values()].sort((left, right) => left.id - right.id) : current;
}

function insertMessage(history: ChatType[], message: ChatType): void {
  const latest = history[history.length - 1];
  if (!latest || latest.id < message.id) {
    history.push(message);
    return;
  }
  if (latest.id === message.id) {
    return;
  }

  // The history's order also serves as its ID index for late or replayed events.
  let first = 0;
  let last = history.length - 1;
  while (first < last) {
    const middle = Math.floor((first + last) / 2);
    if (history[middle].id < message.id) {
      first = middle + 1;
    } else {
      last = middle;
    }
  }
  if (history[first].id !== message.id) {
    history.splice(first, 0, message);
  }
}

export const loadOlderHistory = createAction<DialogAddress>('chatList/loadOlderHistory');
export const retryHistory = createAction<DialogAddress>('chatList/retryHistory');

export const chatListSlice = createSlice({
  name: 'chatList',
  initialState,
  reducers: {
    setOnline: (state, action: PayloadAction<{ id: number; name: string }[]>) => {
      state.online = action.payload;
    },
    setChatConnection: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
      const { history } = state;
      if (!action.payload && history) {
        if (history.initialized && history.afterCursor === null) {
          history.afterCursor = history.messages[history.messages.length - 1]?.id ?? 0;
        }
        history.pending = null;
        history.failed = null;
      }
    },
    openHistory: (state, action: PayloadAction<DialogAddress>) => {
      state.history = {
        ...action.payload,
        messages: [],
        sendFailed: false,
        initialized: false,
        beforeCursor: null,
        afterCursor: null,
        pending: null,
        failed: null,
        lastPageId: null,
        lastOlderPageId: null,
      };
    },
    closeHistory: (state, action: PayloadAction<DialogAddress>) => {
      const { history } = state;
      const { ownerId, receiverId } = action.payload;
      if (history?.ownerId === ownerId && history.receiverId === receiverId) {
        state.history = null;
      }
    },
    chatSendFailed: (state, action: PayloadAction<DialogAddress>) => {
      const { history } = state;
      if (
        history?.ownerId === action.payload.ownerId &&
        history.receiverId === action.payload.receiverId
      ) {
        history.sendFailed = true;
      }
    },
    historyStarted: (state, action: PayloadAction<HistoryPageRequest>) => {
      const { history } = state;
      if (history?.receiverId === action.payload.receiverId) {
        history.pending = action.payload;
        history.failed = null;
      }
    },
    historyFailed: (
      state,
      action: PayloadAction<Pick<HistoryPageRequest, 'requestId' | 'receiverId'>>,
    ) => {
      const { history } = state;
      const { requestId, receiverId } = action.payload;
      if (history?.receiverId === receiverId && history.pending?.requestId === requestId) {
        history.failed = history.pending;
        history.pending = null;
      }
    },
    historyReceived: (state, action: PayloadAction<HistoryPage>) => {
      const { history } = state;
      const page = action.payload;
      if (
        history?.receiverId !== page.receiverId ||
        history.pending?.requestId !== page.requestId
      ) {
        return;
      }
      const request = history.pending;
      const { beforeId, afterId } = request;
      const boundary =
        afterId === undefined ? page.payload[0]?.id : page.payload[page.payload.length - 1]?.id;
      const valid =
        page.payload.length <= request.limit &&
        (page.hasMore ? page.nextCursor === boundary : page.nextCursor === null) &&
        page.payload.every((message, index) => {
          const belongs =
            (message.senderId === history.ownerId && message.receiverId === history.receiverId) ||
            (message.senderId === history.receiverId && message.receiverId === history.ownerId);
          return (
            belongs &&
            Number.isSafeInteger(message.id) &&
            message.id > 0 &&
            (index === 0 || page.payload[index - 1].id < message.id) &&
            (beforeId === undefined || message.id < beforeId) &&
            (afterId === undefined || message.id > afterId)
          );
        });
      history.pending = null;
      if (!valid) {
        history.failed = request;
        return;
      }
      history.messages = mergeHistory(history.messages, page.payload);
      history.initialized = true;
      history.lastPageId = page.requestId;
      if (afterId !== undefined) {
        history.afterCursor = page.nextCursor;
      } else {
        history.beforeCursor = page.nextCursor;
        if (beforeId !== undefined) {
          history.lastOlderPageId = page.requestId;
        }
      }
    },
    addMessage: (state, action: PayloadAction<{ ownerId: number; message: ChatType }>) => {
      const { ownerId, message } = action.payload;
      if (message.senderId !== ownerId && message.receiverId !== ownerId) {
        return;
      }
      const userId = message.senderId === ownerId ? message.receiverId : message.senderId;
      const { history } = state;
      if (history?.ownerId === ownerId && history.receiverId === userId) {
        insertMessage(history.messages, message);
        if (message.senderId === ownerId) {
          history.sendFailed = false;
        }
      }
      const oldIndex = state.chatList.findIndex(
        (row) => row.senderId === userId || row.receiverId === userId,
      );
      const old = state.chatList[oldIndex];
      if (old && old.id > message.id) {
        return;
      }
      const sender =
        message.sender ?? (old?.senderId === message.senderId ? old.sender : old?.receiver);
      const receiver =
        message.receiver ?? (old?.receiverId === message.receiverId ? old.receiver : old?.sender);
      if (!sender || !receiver) {
        return;
      }
      const row: ChatListType = { ...(old?.id === message.id ? old : message), sender, receiver };
      if (old && sameMessage(old, row)) {
        return;
      }
      if (oldIndex !== -1) {
        state.chatList.splice(oldIndex, 1);
      }
      const insertAt = state.chatList.findIndex((item) => item.id < row.id);
      state.chatList.splice(insertAt === -1 ? state.chatList.length : insertAt, 0, row);
    },
    clearChat: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(getReceiverListThunk.pending, (state, action) => {
      state.status = ChatStatus.Loading;
      state.error = null;
      state.requestId = action.meta.requestId;
    });
    builder.addCase(getReceiverListThunk.fulfilled, (state, action) => {
      if (state.requestId !== action.meta.requestId) {
        return;
      }
      const byOtherUser = new Map<number, ChatListType>();
      [...action.payload, ...state.chatList].forEach((row) => {
        const other = row.senderId === action.meta.arg ? row.receiverId : row.senderId;
        const previous = byOtherUser.get(other);
        if (!previous || previous.id < row.id || sameMessage(previous, row)) {
          byOtherUser.set(other, row);
        }
      });
      const rows = [...byOtherUser.values()].sort((a, b) => b.id - a.id);
      if (
        rows.length !== state.chatList.length ||
        rows.some((row, index) => row !== state.chatList[index])
      ) {
        state.chatList = rows;
      }
      state.status = ChatStatus.Ready;
      state.requestId = null;
    });
    builder.addCase(getReceiverListThunk.rejected, (state, action) => {
      if (state.requestId !== action.meta.requestId) {
        return;
      }
      state.status = ChatStatus.Error;
      state.error = 'Не удалось загрузить диалоги.';
      state.requestId = null;
    });
  },
});
export const {
  setOnline,
  openHistory,
  closeHistory,
  historyReceived,
  chatSendFailed,
  addMessage,
  clearChat,
  historyStarted,
  historyFailed,
  setChatConnection,
} = chatListSlice.actions;
export default chatListSlice.reducer;
