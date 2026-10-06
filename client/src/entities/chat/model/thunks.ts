import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ChatListType } from './chatList';
import chatListService from '../api/chatListService';

export const getReceiverListThunk = createAsyncThunk(
  'chatList/getReceiverListThunk',
  (id: ChatListType['senderId']) => chatListService.getChatList(id),
);
