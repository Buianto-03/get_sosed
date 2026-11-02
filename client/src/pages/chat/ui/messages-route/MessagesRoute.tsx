import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { UserStatus } from '@entities/session/model/authModel';
import { ChatStatus, type UserSummary } from '@entities/chat/model/chatListModel';
import { selectChat } from '@entities/chat/model/chatListSelectors';
import { getReceiverListThunk } from '@entities/chat/model/chatListThunk';
import { historyStarted } from '@entities/chat/model/chatListSlice';
import chatListService from '@entities/chat/api/chatListService';
import { chatSocket } from '@entities/chat/model/socket';
import advertService from '@entities/advert/api/advertService';
import type { AdvertType } from '@entities/advert/model/advertsModel';
import { routes } from '@shared/config/routes';
import { getMediaUrl } from '@shared/config/media';
import { ChatPage, type ChatConversation } from '../chat-page/ChatPage';
import { toConversation, toMessages } from './helper';
import styles from './MessagesRoute.module.scss';

export default function MessagesRoute(): JSX.Element | null {
  const { receiverId } = useParams();
  const [params] = useSearchParams();
  const listingId = params.get('listingId');
  const user = useAppSelector((state) => state.auth.user);
  const chat = useAppSelector(selectChat);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [context, setContext] = useState<AdvertType | null>(null);
  const [retry, setRetry] = useState(0);
  const userId = user.status === UserStatus.Logged ? user.id : null;
  const id = Number(receiverId);
  const valid =
    !!receiverId && /^[1-9]\d*$/.test(receiverId) && Number.isSafeInteger(id) && id !== userId;
  useEffect(() => {
    if (userId !== null) void dispatch(getReceiverListThunk(userId));
  }, [dispatch, userId]);
  useEffect(() => {
    setSummary(null);
    setSummaryError('');
    setContext(null);
    setSummaryLoading(!!receiverId);
    if (!receiverId) return undefined;
    if (!valid) {
      setSummaryError('Недопустимый собеседник.');
      setSummaryLoading(false);
      return undefined;
    }
    let active = true;
    void chatListService
      .getSummary(id)
      .then((person) => {
        if (active) setSummary(person);
      })
      .catch(() => {
        if (active) setSummaryError('Собеседник не найден или недоступен.');
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });
    if (listingId && /^[1-9]\d*$/.test(listingId) && Number.isSafeInteger(Number(listingId))) {
      void advertService
        .getAdvertById(Number(listingId))
        .then((advert) => {
          if (active && advert.userId === id) setContext(advert);
        })
        .catch(() => undefined);
    }
    return () => {
      active = false;
    };
  }, [id, valid, receiverId, listingId, retry]);
  useEffect(() => {
    if (!valid || !summary || summary.id !== id) return undefined;
    dispatch(historyStarted(id));
    chatSocket.openDialog(id);
    return () => chatSocket.closeDialog(id);
  }, [dispatch, id, valid, summary, retry]);
  if (userId === null) return null;
  const conversations: ChatConversation[] = chat.chatList.map((row) => {
    const other = row.senderId === userId ? row.receiverId : row.senderId;
    return toConversation(row, userId, chat.messagesByUser[other] ?? []);
  });
  if (valid && summary?.id === id) {
    const active = conversations.find((item) => item.receiverId === id);
    const base: ChatConversation = active ?? {
      id: String(id),
      receiverId: id,
      name: summary.name,
      avatarUrl: getMediaUrl(summary.UserProfile?.photo),
      lastMessage: '',
      messages: toMessages(chat.messagesByUser[id] ?? [], userId),
    };
    const item = {
      ...base,
      listing:
        context?.userId === id && context.id === Number(listingId)
          ? {
            id: String(context.id),
            title: context.title || 'Объявление',
            price: context.price,
            imageUrl: context.AdvertPhotos?.find((photo) => photo.photo)?.photo,
          }
          : undefined,
    };
    const index = conversations.findIndex((entry) => entry.receiverId === id);
    if (index < 0) conversations.push(item);
    else conversations[index] = item;
  }
  const historyLoading =
    !!receiverId &&
    (summaryLoading ||
      (valid &&
        !!summary &&
        (chat.historyStatus[id] === ChatStatus.Loading || !chat.historyStatus[id])));
  const historyError =
    summaryError ||
    (chat.historyStatus[id] === ChatStatus.Error
      ? 'Не удалось загрузить историю. Проверьте соединение.'
      : '');
  return (
    <div className={styles.messages__route}>
      <ChatPage
        key={userId}
        conversations={conversations}
        selectedConversationId={receiverId ?? null}
        listLoading={chat.status === ChatStatus.Loading}
        listError={chat.error}
        onRetryList={() => {
          void dispatch(getReceiverListThunk(userId));
        }}
        historyLoading={historyLoading}
        historyError={historyError}
        onRetryHistory={() => setRetry((value) => value + 1)}
        onSelectConversation={(other) => navigate(routes.messageThread(other))}
        onBackToList={() => navigate(routes.messages)}
        onOpenListing={(advertId) => navigate(routes.listingDetails(advertId))}
        onSendMessage={(other, text) =>
          valid &&
          summary?.id === Number(other) &&
          !summaryError &&
          chatSocket.sendMessage(Number(other), text)
        }
      />
    </div>
  );
}
