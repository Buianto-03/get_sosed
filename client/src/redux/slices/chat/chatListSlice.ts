import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatListSlice, ChatListType } from '../../../types/chatList';
import { getReceiverListThunk } from './thunks';

const initialState: ChatListSlice = {
  chatList: [],
};

export const chatListSlice = createSlice({
  name: 'chatList',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getReceiverListThunk.fulfilled, (state, action) => {
      state.chatList = action.payload;
    });
  },
});

export default chatListSlice.reducer;