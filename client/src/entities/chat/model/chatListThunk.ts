import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ChatListType } from './chatListModel';
import chatListService from '../api/chatListService';

export const getReceiverListThunk = createAsyncThunk(
  'chatList/getReceiverListThunk',
  (id: ChatListType['senderId'], { signal }) => chatListService.getChatList(id, { signal }),
);
