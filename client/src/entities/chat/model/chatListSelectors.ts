import type { ChatStatus, ChatListSlice, ChatListType, DialogHistory } from './chatListModel';

type ChatRoot = { chatList: ChatListSlice };

export const selectChatRows = (state: ChatRoot): ChatListType[] => state.chatList.chatList;
export const selectChatListStatus = (state: ChatRoot): ChatStatus => state.chatList.status;
export const selectChatListError = (state: ChatRoot): string | null => state.chatList.error;
export const selectChatHistory = (
  state: ChatRoot,
  ownerId: number | null,
  receiverId: number | null,
): DialogHistory | null => {
  const { history } = state.chatList;
  return history?.ownerId === ownerId && history.receiverId === receiverId ? history : null;
};
export const selectChatConnection = (state: ChatRoot): boolean => state.chatList.connected;
