import React, { useEffect, useRef, useState } from 'react';
import { LuArrowLeft, LuMessagesSquare } from 'react-icons/lu';
import { MessageComposer } from '@features/send-message/ui/message-composer/MessageComposer';
import { ConversationRow } from '@entities/chat/ui/ConversationRow';
import { ListingContextCard } from '@entities/listing/ui/listing-context-card/ListingContextCard';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { EmptyState } from '@shared/ui/feedback/EmptyState';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { Spinner } from '@shared/ui/feedback/Spinner';
import { Avatar } from '@shared/ui/avatar/Avatar';
import styles from './ChatPage.module.scss';

export type ChatMessage = {
  id: string;
  from: 'me' | 'them';
  text: string;
};

export interface ChatConversation {
  id: string;
  receiverId: number;
  name: string;
  avatarUrl?: string;
  listing?: { id: string; title: string; price: number | null; imageUrl?: string };
  lastMessage: string;
  time?: string;
  messages: ChatMessage[];
}

export interface ChatPageProps {
  conversations: ChatConversation[];
  selectedConversationId: string | null;
  empty?: boolean;
  listLoading?: boolean;
  listError?: string | null;
  historyLoading?: boolean;
  historyError?: string | null;
  onRetryList?: () => void;
  onRetryHistory?: () => void;
  onSelectConversation: (id: string) => void;
  onBackToList: () => void;
  onOpenListing?: (id: string) => void;
  onSendMessage: (conversationId: string, message: string) => boolean;
}

export function ChatPage({
  conversations,
  selectedConversationId,
  empty = false,
  listLoading,
  listError,
  historyLoading,
  historyError,
  onRetryList,
  onRetryHistory,
  onSelectConversation,
  onBackToList,
  onOpenListing,
  onSendMessage,
}: ChatPageProps): JSX.Element {
  const activeConversation = conversations.find(({ id }) => id === selectedConversationId);
  const hasActiveConversation = Boolean(activeConversation);
  const [announcement, setAnnouncement] = useState('');
  const seenMessages = useRef<{ conversation: string | null; ids: Set<string> }>({
    conversation: selectedConversationId,
    ids: new Set(activeConversation?.messages.map((message) => message.id)),
  });
  const wasHistoryLoading = useRef(historyLoading);
  const messageListRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const lastMessageId = activeConversation?.messages[activeConversation.messages.length - 1]?.id;
  const messageCount = activeConversation?.messages.length ?? 0;

  useEffect(() => {
    const messages = activeConversation?.messages ?? [];
    const previous = seenMessages.current;
    if (previous.conversation === selectedConversationId && !historyLoading && !wasHistoryLoading.current) {
      const incoming = messages.filter((message) => message.from === 'them' && !previous.ids.has(message.id));
      setAnnouncement(incoming.map((message) => `${activeConversation?.name}: ${message.text}`).join(' '));
    } else {
      setAnnouncement('');
    }
    seenMessages.current = { conversation: selectedConversationId, ids: new Set(messages.map((message) => message.id)) };
    wasHistoryLoading.current = historyLoading;
  }, [activeConversation?.messages, activeConversation?.name, historyLoading, selectedConversationId]);

  useEffect(() => {
    const list = messageListRef.current;
    if (list && followLatest.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [selectedConversationId, lastMessageId, messageCount]);

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
  }, [selectedConversationId, hasActiveConversation]);

  useEffect(() => {
    followLatest.current = true;
  }, [selectedConversationId]);

  const sendToConversation = (conversationId: string, message: string): boolean => {
    const sent = onSendMessage(conversationId, message);
    if (sent) {
      followLatest.current = true;
    }
    return sent;
  };

  return (
    <main className={styles.chat}>
      <span className={styles.chat__announcement} role="status" aria-atomic="true">{announcement}</span>
      <div className={styles.chat__heading}>
        <Heading level={HeadingLevel.H1} size={HeadingSize.Xl}>
          Сообщения
        </Heading>
      </div>
      <div
        className={styles.chat__workspace}
        data-mobile-view={selectedConversationId ? 'conversation' : 'list'}
      >
        <section className={styles.chat__conversations} aria-label="Диалоги">
          <Heading level={HeadingLevel.H2} size={HeadingSize.Md}>
            Диалоги
          </Heading>
          {listLoading && <Spinner label="Загрузка диалогов" />}
          {!listLoading && listError && (
            <>
              <Alert variant={AlertVariant.Error}>{listError}</Alert>
              <Button onClick={onRetryList}>Повторить загрузку диалогов</Button>
            </>
          )}
          {!listLoading &&
            !listError &&
            (empty || conversations.length === 0 ? (
              <EmptyState
                className={styles.chat__empty}
                title="Пока нет сообщений"
                description="Когда вы начнёте общение, диалоги появятся здесь."
                icon={<LuMessagesSquare />}
              />
            ) : (
              <div className={styles.rows}>
                {conversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    name={conversation.name}
                    listingTitle={conversation.listing?.title}
                    avatarUrl={conversation.avatarUrl}
                    lastMessage={conversation.lastMessage}
                    time={conversation.time}
                    active={conversation.id === selectedConversationId}
                    onSelect={() => onSelectConversation(conversation.id)}
                  />
                ))}
              </div>
            ))}
        </section>

        <section className={styles.chat__thread} aria-label="Переписка">
          {activeConversation && (
            <>
              <header className={styles.chat__header}>
                <Button
                  className={styles.chat__back}
                  variant={ButtonVariant.Text}
                  onClick={onBackToList}
                >
                  <LuArrowLeft aria-hidden="true" />К диалогам
                </Button>
                <Avatar name={activeConversation.name} src={activeConversation.avatarUrl} />
                <strong title={activeConversation.name}>{activeConversation.name}</strong>
              </header>
              {activeConversation.listing && (
                <ListingContextCard
                  title={activeConversation.listing.title}
                  price={activeConversation.listing.price}
                  imageUrl={activeConversation.listing.imageUrl}
                  onOpen={() => {
                    if (activeConversation.listing) {
                      onOpenListing?.(activeConversation.listing.id);
                    }
                  }}
                />
              )}
              {historyLoading && <Spinner label="Загрузка переписки" />}
              {historyError && (
                <>
                  <Alert variant={AlertVariant.Error}>{historyError}</Alert>
                  <Button onClick={onRetryHistory}>Повторить загрузку переписки</Button>
                </>
              )}
              <div
                ref={messageListRef}
                className={styles.chat__messages}
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
                {activeConversation.messages.map((message) => (
                  <p
                    className={message.from === 'me' ? styles.chat__message_mine : styles.chat__message}
                    key={message.id}
                  >
                    {message.text}
                  </p>
                ))}
              </div>
              <MessageComposer
                key={activeConversation.id}
                conversationId={activeConversation.id}
                loading={historyLoading}
                onSendMessage={sendToConversation}
              />
            </>
          )}
          {!activeConversation && selectedConversationId && (
            <>
              <Button variant={ButtonVariant.Text} onClick={onBackToList}>
                К диалогам
              </Button>
              {historyLoading && <Spinner label="Загрузка собеседника" />}
              {!historyLoading && (
                <Alert variant={AlertVariant.Error}>
                  {historyError || 'Собеседник недоступен'}
                </Alert>
              )}
              {!historyLoading && onRetryHistory && (
                <Button onClick={onRetryHistory}>Повторить загрузку собеседника</Button>
              )}
            </>
          )}
          {!activeConversation && !selectedConversationId && (
            <EmptyState
              className={styles.chat__selection_empty}
              title={empty ? 'Нет выбранного диалога' : 'Выберите диалог'}
              description="Здесь появится переписка с автором объявления."
              icon={<LuMessagesSquare />}
            />
          )}
        </section>
      </div>
    </main>
  );
}
