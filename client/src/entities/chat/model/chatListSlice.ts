import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ChatListSlice } from './chatList';
import type { ChatType } from './chat';
import { getReceiverListThunk } from './thunks';

const initialState: ChatListSlice = {
  chatList: [],
  online: [],
  messagesByUser: {},
};

export const chatListSlice = createSlice({
  name: 'chatList',
  initialState,
  reducers: {
    setOnline: (state, action: PayloadAction<{ id: number; name: string }[]>) => {
      state.online = action.payload;
    },
    setMessages: (state, action: PayloadAction<{ receiverId: number; messages: ChatType[] }>) => {
      state.messagesByUser[action.payload.receiverId] = action.payload.messages;
    },
    addMessage: (state, action: PayloadAction<{ userId: number; message: ChatType }>) => {
      const { userId, message } = action.payload;
      const messages = state.messagesByUser[userId] ?? [];
      if (!messages.some((existing) => existing.id === message.id)) messages.push(message);
      state.messagesByUser[userId] = messages;
    },
    clearChat: (state) => {
      state.chatList = [];
      state.online = [];
      state.messagesByUser = {};
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getReceiverListThunk.fulfilled, (state, action) => {
      state.chatList = action.payload;
    });
  },
});

export const { setOnline, setMessages, addMessage, clearChat } = chatListSlice.actions;

export default chatListSlice.reducer;
