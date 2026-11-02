import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { ChatStatus, type ChatListSlice, type ChatListType } from './chatListModel';
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
export const chatListSlice = createSlice({
  name: 'chatList',
  initialState,
  reducers: {
    setOnline: (state, action: PayloadAction<{ id: number; name: string }[]>) => {
      state.online = action.payload;
    },
    setChatConnection: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
      if (!action.payload)
        Object.keys(state.historyStatus).forEach((id) => {
          if (state.historyStatus[Number(id)] === ChatStatus.Loading)
            state.historyStatus[Number(id)] = ChatStatus.Error;
        });
    },
    historyStarted: (state, action: PayloadAction<number>) => {
      state.historyStatus[action.payload] = ChatStatus.Loading;
    },
    historyFailed: (state, action: PayloadAction<number>) => {
      state.historyStatus[action.payload] = ChatStatus.Error;
    },
    setMessages: (state, action: PayloadAction<{ receiverId: number; messages: ChatType[] }>) => {
      const { receiverId, messages } = action.payload;
      const merged = new Map(
        [...(state.messagesByUser[receiverId] ?? []), ...messages].map((message) => [
          message.id,
          message,
        ]),
      );
      state.messagesByUser[receiverId] = [...merged.values()].sort((a, b) => a.id - b.id);
      state.historyStatus[receiverId] = ChatStatus.Ready;
    },
    addMessage: (state, action: PayloadAction<{ userId: number; message: ChatType }>) => {
      const { userId, message } = action.payload;
      const messages = state.messagesByUser[userId] ?? [];
      if (!messages.some((existing) => existing.id === message.id)) messages.push(message);
      state.messagesByUser[userId] = messages.sort((a, b) => a.id - b.id);
      const old = state.chatList.find(
        (row) => row.senderId === userId || row.receiverId === userId,
      );
      if (old && old.id > message.id) return;
      const sender =
        message.sender ?? (old?.senderId === message.senderId ? old.sender : old?.receiver);
      const receiver =
        message.receiver ?? (old?.receiverId === message.receiverId ? old.receiver : old?.sender);
      if (sender && receiver) {
        const row: ChatListType = { ...message, sender, receiver };
        state.chatList = [
          row,
          ...state.chatList.filter(
            (item) => item.senderId !== userId && item.receiverId !== userId,
          ),
        ].sort((a, b) => b.id - a.id);
      }
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
      if (state.requestId !== action.meta.requestId) return;
      const byOtherUser = new Map<number, ChatListType>();
      [...action.payload, ...state.chatList].forEach((row) => {
        const other = row.senderId === action.meta.arg ? row.receiverId : row.senderId;
        if (!byOtherUser.has(other) || (byOtherUser.get(other)?.id ?? 0) < row.id)
          byOtherUser.set(other, row);
      });
      state.chatList = [...byOtherUser.values()].sort((a, b) => b.id - a.id);
      state.status = ChatStatus.Ready;
      state.requestId = null;
    });
    builder.addCase(getReceiverListThunk.rejected, (state, action) => {
      if (state.requestId !== action.meta.requestId) return;
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
