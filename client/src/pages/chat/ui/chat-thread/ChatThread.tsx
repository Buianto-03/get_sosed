import React, { memo, useEffect, useRef, useState } from 'react';
import { MessageComposer } from '@features/send-message/ui/message-composer/MessageComposer';
import { ListingContextCard } from '@entities/listing/ui/listing-context-card/ListingContextCard';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Avatar } from '@shared/ui/avatar/Avatar';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { Spinner } from '@shared/ui/feedback/Spinner';
import { ChatListButton } from '../chat-list-button/ChatListButton';
import { MessageViewport } from '../message-viewport/MessageViewport';
import styles from './ChatThread.module.scss';

export type ChatMessage = {
  id: string;
  from: 'me' | 'them';
  text: string;
};

export interface ChatListingContext {
  id: string;
  title: string;
  price: number | null;
  imageUrl?: string;
}

interface ChatThreadProps {
  conversationId: string;
  name: string;
  avatarUrl?: string;
  listing?: ChatListingContext;
  messages: ChatMessage[];
  loading?: boolean;
  error?: string | null;
  awaitingConnection?: boolean;
  sendFailed?: boolean;
  hasOlder?: boolean;
  olderDisabled?: boolean;
  lastPageId?: string | null;
  lastOlderPageId?: string | null;
  onLoadOlder?: () => void;
  onRetry?: () => void;
  onOpenListing?: (id: string) => void;
  onSendMessage: (conversationId: string, message: string) => boolean;
}

function ChatThreadView({
  conversationId,
  name,
  avatarUrl,
  listing,
  messages,
  loading,
  error,
  awaitingConnection,
  sendFailed,
  hasOlder,
  olderDisabled,
  lastPageId,
  lastOlderPageId,
  onLoadOlder,
  onRetry,
  onOpenListing,
  onSendMessage,
}: ChatThreadProps): JSX.Element {
  const [announcement, setAnnouncement] = useState('');
  const seenIds = useRef<Set<string> | null>(null);
  const wasLoading = useRef(loading);
  const previousPage = useRef(lastPageId);
  const viewport = useRef<MessageViewport>(null);

  useEffect(() => {
    const previous = seenIds.current;
    if (previous && !loading && !wasLoading.current && previousPage.current === lastPageId) {
      const incoming = messages.filter(
        (message) => message.from === 'them' && !previous.has(message.id),
      );
      setAnnouncement(incoming.map((message) => `${name}: ${message.text}`).join(' '));
    } else {
      setAnnouncement('');
    }
    seenIds.current = new Set(messages.map((message) => message.id));
    wasLoading.current = loading;
    previousPage.current = lastPageId;
  }, [messages, name, loading, lastPageId]);

  const sendToConversation = (id: string, message: string): boolean => {
    const sent = onSendMessage(id, message);
    if (sent) {
      viewport.current?.followEnd();
    }
    return sent;
  };

  return (
    <>
      <span className={styles.thread__announcement} role="status" aria-atomic="true">
        {announcement}
      </span>
      <header className={styles.thread__header}>
        <ChatListButton className={styles.thread__back} withIcon />
        <Avatar name={name} src={avatarUrl} />
        <strong title={name}>{name}</strong>
      </header>
      {listing && (
        <ListingContextCard
          title={listing.title}
          price={listing.price}
          imageUrl={listing.imageUrl}
          onOpen={() => onOpenListing?.(listing.id)}
        />
      )}
      {awaitingConnection && <Alert>Ожидаем подключения к чату…</Alert>}
      {!awaitingConnection && loading && <Spinner label="Загрузка переписки" />}
      {sendFailed && <Alert variant={AlertVariant.Error}>Не удалось отправить сообщение.</Alert>}
      {error && (
        <>
          <Alert variant={AlertVariant.Error}>{error}</Alert>
          <Button onClick={onRetry}>Повторить загрузку переписки</Button>
        </>
      )}
      <MessageViewport ref={viewport} lastOlderPageId={lastOlderPageId}>
        {hasOlder && (
          <Button
            variant={ButtonVariant.Text}
            aria-disabled={olderDisabled}
            onClick={olderDisabled ? undefined : onLoadOlder}
          >
            Загрузить предыдущие сообщения
          </Button>
        )}
        {messages.map((message) => (
          <p
            className={message.from === 'me' ? styles.thread__message_mine : styles.thread__message}
            key={message.id}
            data-message-id={message.id}
          >
            {message.text}
          </p>
        ))}
      </MessageViewport>
      <MessageComposer
        conversationId={conversationId}
        loading={loading}
        onSendMessage={sendToConversation}
      />
    </>
  );
}

export const ChatThread = memo(ChatThreadView);
