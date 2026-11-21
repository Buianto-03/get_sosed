import React, { memo, useEffect, useRef, useState } from 'react';
import { LuArrowLeft } from 'react-icons/lu';
import { MessageComposer } from '@features/send-message/ui/message-composer/MessageComposer';
import { ListingContextCard } from '@entities/listing/ui/listing-context-card/ListingContextCard';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Avatar } from '@shared/ui/avatar/Avatar';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { Spinner } from '@shared/ui/feedback/Spinner';
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
  onRetry?: () => void;
  onBackToList: () => void;
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
  onRetry,
  onBackToList,
  onOpenListing,
  onSendMessage,
}: ChatThreadProps): JSX.Element {
  const [announcement, setAnnouncement] = useState('');
  const seenIds = useRef<Set<string> | null>(null);
  const wasLoading = useRef(loading);
  const messageListRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    const previous = seenIds.current;
    if (previous && !loading && !wasLoading.current) {
      const incoming = messages.filter(
        (message) => message.from === 'them' && !previous.has(message.id),
      );
      setAnnouncement(incoming.map((message) => `${name}: ${message.text}`).join(' '));
    } else {
      setAnnouncement('');
    }
    seenIds.current = new Set(messages.map((message) => message.id));
    wasLoading.current = loading;
  }, [messages, name, loading]);

  useEffect(() => {
    const list = messageListRef.current;
    if (list && followLatest.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [lastMessageId, messages.length]);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      if (followLatest.current) {
        list.scrollTop = list.scrollHeight;
      }
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  const sendToConversation = (id: string, message: string): boolean => {
    const sent = onSendMessage(id, message);
    if (sent) {
      followLatest.current = true;
    }
    return sent;
  };

  return (
    <>
      <span className={styles.thread__announcement} role="status" aria-atomic="true">
        {announcement}
      </span>
      <header className={styles.thread__header}>
        <Button className={styles.thread__back} variant={ButtonVariant.Text} onClick={onBackToList}>
          <LuArrowLeft aria-hidden="true" />К диалогам
        </Button>
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
      {loading && <Spinner label="Загрузка переписки" />}
      {error && (
        <>
          <Alert variant={AlertVariant.Error}>{error}</Alert>
          <Button onClick={onRetry}>Повторить загрузку переписки</Button>
        </>
      )}
      <div
        ref={messageListRef}
        className={styles.thread__messages}
        aria-label="Сообщения"
        role="region"
        // Keyboard users must be able to scroll history independently of the composer.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onScroll={(event) => {
          const list = event.currentTarget;
          followLatest.current = list.scrollHeight - list.clientHeight - list.scrollTop < 8;
        }}
      >
        {messages.map((message) => (
          <p
            className={message.from === 'me' ? styles.thread__message_mine : styles.thread__message}
            key={message.id}
          >
            {message.text}
          </p>
        ))}
      </div>
      <MessageComposer
        conversationId={conversationId}
        loading={loading}
        onSendMessage={sendToConversation}
      />
    </>
  );
}

export const ChatThread = memo(ChatThreadView);
