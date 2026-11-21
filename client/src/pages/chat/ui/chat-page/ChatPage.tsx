import React from 'react';
import { LuMessagesSquare } from 'react-icons/lu';
import { ConversationRow } from '@entities/chat/ui/conversation-row/ConversationRow';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { EmptyState } from '@shared/ui/feedback/EmptyState';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { Spinner } from '@shared/ui/feedback/Spinner';
import { ChatThread, type ChatListingContext, type ChatMessage } from '../chat-thread/ChatThread';
import styles from './ChatPage.module.scss';

export interface ChatConversationRow {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  time?: string;
}

export interface ChatPageProps {
  conversations: ChatConversationRow[];
  selectedConversationId: string | null;
  messages: ChatMessage[];
  listing?: ChatListingContext;
  listLoading?: boolean;
  listError?: string | null;
  historyLoading?: boolean;
  historyError?: string | null;
  awaitingConnection?: boolean;
  sendFailed?: boolean;
  hasOlder?: boolean;
  olderDisabled?: boolean;
  lastPageId?: string | null;
  lastOlderPageId?: string | null;
  onLoadOlder?: () => void;
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
  messages,
  listing,
  listLoading,
  listError,
  historyLoading,
  historyError,
  awaitingConnection,
  sendFailed,
  hasOlder,
  olderDisabled,
  lastPageId,
  lastOlderPageId,
  onLoadOlder,
  onRetryList,
  onRetryHistory,
  onSelectConversation,
  onBackToList,
  onOpenListing,
  onSendMessage,
}: ChatPageProps): JSX.Element {
  const activeConversation = conversations.find(({ id }) => id === selectedConversationId);

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
            (conversations.length === 0 ? (
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
                    id={conversation.id}
                    name={conversation.name}
                    listingTitle={
                      conversation.id === selectedConversationId ? listing?.title : undefined
                    }
                    avatarUrl={conversation.avatarUrl}
                    lastMessage={conversation.lastMessage}
                    time={conversation.time}
                    active={conversation.id === selectedConversationId}
                    onSelect={onSelectConversation}
                  />
                ))}
              </div>
            ))}
        </section>

        <section className={styles.chat__thread} aria-label="Переписка">
          {activeConversation && (
            <ChatThread
              key={activeConversation.id}
              conversationId={activeConversation.id}
              name={activeConversation.name}
              avatarUrl={activeConversation.avatarUrl}
              listing={listing}
              messages={messages}
              loading={historyLoading}
              error={historyError}
              onRetry={onRetryHistory}
              awaitingConnection={awaitingConnection}
              sendFailed={sendFailed}
              hasOlder={hasOlder}
              olderDisabled={olderDisabled}
              lastPageId={lastPageId}
              lastOlderPageId={lastOlderPageId}
              onLoadOlder={onLoadOlder}
              onBackToList={onBackToList}
              onOpenListing={onOpenListing}
              onSendMessage={onSendMessage}
            />
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
              title="Выберите диалог"
              description="Здесь появится переписка с автором объявления."
              icon={<LuMessagesSquare />}
            />
          )}
        </section>
      </div>
    </main>
  );
}
