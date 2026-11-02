import type { ChatListType } from '@entities/chat/model/chatListModel';
import type { ChatType } from '@entities/chat/model/chat';
import { getMediaUrl } from '@shared/config/media';
import type { ChatConversation, ChatMessage } from '../chat-page/ChatPage';

export function toMessages(messages: ChatType[], userId: number): ChatMessage[] {
  return messages.map((message) => ({
    id: String(message.id),
    from: message.senderId === userId ? 'me' : 'them',
    text: message.message,
  }));
}
export function toConversation(
  row: ChatListType,
  userId: number,
  messages: ChatType[],
): ChatConversation {
  const other = row.senderId === userId ? row.receiver : row.sender;
  return {
    id: String(other.id),
    receiverId: other.id,
    name: other.name,
    avatarUrl: getMediaUrl(other.UserProfile?.photo),
    lastMessage: row.message,
    time: row.createdAt
      ? new Date(row.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      : undefined,
    messages: toMessages(messages, userId),
  };
}
