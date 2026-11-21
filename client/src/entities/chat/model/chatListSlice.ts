import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  ChatStatus,
  type ChatListSlice,
  type ChatListType,
  type UserSummary,
} from './chatListModel';
import type { ChatType } from './chat';
import { getReceiverListThunk } from './chatListThunk';

const initialState: ChatListSlice = {
  chatList: [],
  online: [],
  messagesByUser: {},
  historyStatus: {},
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

export const chatListSlice = createSlice({
  name: 'chatList',
  initialState,
  reducers: {
    setOnline: (state, action: PayloadAction<{ id: number; name: string }[]>) => {
      state.online = action.payload;
    },
    setChatConnection: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
      if (!action.payload) {
        Object.keys(state.historyStatus).forEach((id) => {
          if (state.historyStatus[Number(id)] === ChatStatus.Loading) {
            state.historyStatus[Number(id)] = ChatStatus.Error;
          }
        });
      }
    },
    historyStarted: (state, action: PayloadAction<number>) => {
      state.historyStatus[action.payload] = ChatStatus.Loading;
    },
    historyFailed: (state, action: PayloadAction<number>) => {
      state.historyStatus[action.payload] = ChatStatus.Error;
    },
    setMessages: (state, action: PayloadAction<{ receiverId: number; messages: ChatType[] }>) => {
      const { receiverId, messages } = action.payload;
      state.messagesByUser[receiverId] = mergeHistory(
        state.messagesByUser[receiverId] ?? [],
        messages,
      );
      state.historyStatus[receiverId] = ChatStatus.Ready;
    },
    addMessage: (state, action: PayloadAction<{ userId: number; message: ChatType }>) => {
      const { userId, message } = action.payload;
      const history = state.messagesByUser[userId];
      if (history) {
        insertMessage(history, message);
      } else {
        state.messagesByUser[userId] = [message];
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
  setMessages,
  addMessage,
  clearChat,
  historyStarted,
  historyFailed,
  setChatConnection,
} = chatListSlice.actions;
export default chatListSlice.reducer;
