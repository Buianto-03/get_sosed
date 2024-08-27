import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ChatListType } from '../../../types/chatList';
import chatListService from '../../../services/chatListService';

export const getReceiverListThunk = createAsyncThunk(
  'chatList/getReceiverListThunk',
  (id: ChatListType['senderId']) => chatListService.getChatList(id),
);

export const a = 3;
