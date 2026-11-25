import { createSelector } from '@reduxjs/toolkit';
import type { ChatListType } from '@entities/chat/model/chatListModel';
import type { ChatType } from '@entities/chat/model/chat';
import type { Listing } from '@entities/listing/model';
import { getMediaUrl } from '@shared/config/media';
import type { ChatConversationRow } from '../chat-page/ChatPage';
import type { ChatListingContext, ChatMessage } from '../chat-thread/ChatThread';

const timeFormat: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

export function parseId(value: string | null | undefined): number | null {
  const id = Number(value);
  return value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(id) ? id : null;
}

export function toMessages(messages: ChatType[], userId: number): ChatMessage[] {
  return messages.map((message) => ({
    id: String(message.id),
    from: message.senderId === userId ? 'me' : 'them',
    text: message.message,
  }));
}

export const toConversationRow = createSelector(
  [(row: ChatListType) => row, (_row: ChatListType, userId: number) => userId],
  (row, userId): ChatConversationRow => {
    const other = row.senderId === userId ? row.receiver : row.sender;
    return {
      id: String(other.id),
      name: other.name,
      avatarUrl: getMediaUrl(other.UserProfile?.photo),
      lastMessage: row.message,
      time: row.createdAt ? new Date(row.createdAt).toLocaleTimeString('ru-RU', timeFormat) : undefined,
    };
  },
);

export function toListingContext(advert: Listing): ChatListingContext {
  return {
    id: String(advert.id),
    title: advert.title || 'Объявление',
    price: advert.price,
    imageUrl: advert.AdvertPhotos?.find((photo) => photo.photo)?.photo,
  };
}
