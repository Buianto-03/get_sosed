import type { ChatType } from './chat';
import { ChatStatus, type ChatListSlice, type ChatListType } from './chatListModel';

type ChatRoot = { chatList: ChatListSlice };

const emptyHistory: ChatType[] = [];

export const selectChatRows = (state: ChatRoot): ChatListType[] => state.chatList.chatList;
export const selectChatListStatus = (state: ChatRoot): ChatStatus => state.chatList.status;
export const selectChatListError = (state: ChatRoot): string | null => state.chatList.error;
export const selectChatHistory = (state: ChatRoot, id: number | null): ChatType[] =>
  id === null ? emptyHistory : state.chatList.messagesByUser[id] ?? emptyHistory;
export const selectChatHistoryStatus = (state: ChatRoot, id: number | null): ChatStatus =>
  id === null ? ChatStatus.Idle : state.chatList.historyStatus[id] ?? ChatStatus.Idle;
export const selectChatConnection = (state: ChatRoot): boolean => state.chatList.connected;
