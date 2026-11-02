import type { ChatListSlice } from './chatListModel';

export const selectChat = (state: { chatList: ChatListSlice }): ChatListSlice => state.chatList;
