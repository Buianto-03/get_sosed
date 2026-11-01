import React, { useEffect, useRef, useState } from 'react';
import { LuArrowLeft, LuMessagesSquare } from 'react-icons/lu';
import { ConversationRow } from '@entities/chat/ui/ConversationRow';
import { ListingContextCard } from '@entities/listing/ui/listing-context-card/ListingContextCard';
import { Button, ButtonSize, ButtonType, ButtonVariant } from '@shared/ui/button/Button';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { EmptyState } from '@shared/ui/feedback/EmptyState';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { Spinner } from '@shared/ui/feedback/Spinner';
import { Input } from '@shared/ui/input/Input';
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
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const lastMessageId = activeConversation?.messages[activeConversation.messages.length - 1]?.id;
  const messageCount = activeConversation?.messages.length ?? 0;

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
    setDraft('');
    setSendError(false);
  }, [selectedConversationId]);

  const sendMessage = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const message = draft.trim();
    if (!activeConversation || !message) {
      return;
    }
    const sent = onSendMessage(activeConversation.id, message);
    setSendError(!sent);
    if (sent) {
      followLatest.current = true;
      setDraft('');
    }
  };

  return (
    <main className={styles.chat}>
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
              <div className={styles.chat__replies}>
                <Button
                  className={styles.chat__reply}
                  size={ButtonSize.Sm}
                  variant={ButtonVariant.Secondary}
                  onClick={() => setDraft('Здравствуйте!')}
                >
                  Здравствуйте!
                </Button>
                <Button
                  className={styles.chat__reply}
                  size={ButtonSize.Sm}
                  variant={ButtonVariant.Secondary}
                  onClick={() => setDraft('Когда можно посмотреть?')}
                >
                  Когда можно посмотреть?
                </Button>
              </div>
              {sendError && (
                <Alert className={styles.chat__error} variant={AlertVariant.Error}>
                  Не удалось отправить сообщение. Попробуйте ещё раз.
                </Alert>
              )}
              <form className={styles.chat__composer} onSubmit={sendMessage}>
                <Input
                  id="chat-message-input"
                  label="Сообщение"
                  fieldClassName={styles.chat__composer_field}
                  autoComplete="off"
                  maxLength={10000}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (sendError) {
                      setSendError(false);
                    }
                  }}
                  placeholder="Напишите сообщение"
                />
                <Button type={ButtonType.Submit} disabled={historyLoading}>
                  Отправить
                </Button>
              </form>
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
