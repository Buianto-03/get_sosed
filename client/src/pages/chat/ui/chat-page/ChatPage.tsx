import React, { useEffect, useState } from 'react';
import { LuArrowLeft, LuMessagesSquare } from 'react-icons/lu';
import { ConversationRow } from '@entities/chat/ui/ConversationRow';
import { ListingContextCard } from '@entities/listing/ui/listing-context-card/ListingContextCard';
import { Button, ButtonSize, ButtonType, ButtonVariant } from '@shared/ui/button/Button';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { EmptyState } from '@shared/ui/feedback/EmptyState';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { Input } from '@shared/ui/input/Input';
import styles from './ChatPage.module.scss';

export type ChatMessage = {
  id: string;
  from: 'me' | 'them';
  text: string;
};

export type ChatConversation = {
  id: string;
  name: string;
  advert: string;
  lastMessage: string;
  time: string;
  price: number;
  imageUrl?: string;
  messages: ChatMessage[];
};

export interface ChatPageProps {
  conversations: ChatConversation[];
  selectedConversationId: string | null;
  empty?: boolean;
  longMessage?: string;
  onSelectConversation: (id: string) => void;
  onBackToList: () => void;
  onOpenListing?: (id: string) => void;
  onSendMessage: (conversationId: string, message: string) => boolean;
}

export function ChatPage({
  conversations,
  selectedConversationId,
  empty = false,
  longMessage,
  onSelectConversation,
  onBackToList,
  onOpenListing,
  onSendMessage,
}: ChatPageProps): JSX.Element {
  const activeConversation = conversations.find(({ id }) => id === selectedConversationId);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState(false);

  useEffect(() => {
    setDraft('');
    setSendError(false);
  }, [selectedConversationId]);

  const sendMessage = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const message = draft.trim();
    if (!activeConversation || !message) return;
    const sent = onSendMessage(activeConversation.id, message);
    setSendError(!sent);
    if (sent) setDraft('');
  };

  return (
    <main className={styles.page}>
      <div className={styles.pageHeading}>
        <Heading level={HeadingLevel.H1} size={HeadingSize.Xl}>
          Сообщения
        </Heading>
      </div>
      <div
        className={styles.workspace}
        data-mobile-view={activeConversation ? 'conversation' : 'list'}
      >
        <section className={styles.conversationList} aria-label="Диалоги">
          <Heading level={HeadingLevel.H2} size={HeadingSize.Md}>
            Диалоги
          </Heading>
          {empty || conversations.length === 0 ? (
            <EmptyState
              className={styles.emptyState}
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
                  listingTitle={conversation.advert}
                  lastMessage={conversation.lastMessage}
                  time={conversation.time}
                  active={conversation.id === selectedConversationId}
                  onSelect={() => onSelectConversation(conversation.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className={styles.thread} aria-label="Переписка">
          {activeConversation ? (
            <>
              <header className={styles.threadHeader}>
                <Button
                  className={styles.backButton}
                  variant={ButtonVariant.Text}
                  onClick={onBackToList}
                >
                  <LuArrowLeft aria-hidden="true" />К диалогам
                </Button>
                <strong>{activeConversation.name}</strong>
              </header>
              <ListingContextCard
                title={activeConversation.advert}
                price={activeConversation.price}
                imageUrl={activeConversation.imageUrl}
                onOpen={() => onOpenListing?.(activeConversation.id)}
              />
              <div className={styles.messageList} aria-label="Сообщения">
                {activeConversation.messages.map((message) => (
                  <p
                    className={message.from === 'me' ? styles.messageMine : styles.message}
                    key={message.id}
                  >
                    {message.id === 'm2' && longMessage ? longMessage : message.text}
                  </p>
                ))}
              </div>
              <div className={styles.quickReplies}>
                <Button
                  className={styles.quickReply}
                  size={ButtonSize.Sm}
                  variant={ButtonVariant.Secondary}
                  onClick={() => setDraft('Здравствуйте!')}
                >
                  Здравствуйте!
                </Button>
                <Button
                  className={styles.quickReply}
                  size={ButtonSize.Sm}
                  variant={ButtonVariant.Secondary}
                  onClick={() => setDraft('Когда можно посмотреть?')}
                >
                  Когда можно посмотреть?
                </Button>
              </div>
              {sendError && (
                <Alert className={styles.sendError} variant={AlertVariant.Error}>
                  Не удалось отправить сообщение. Попробуйте ещё раз.
                </Alert>
              )}
              <form className={styles.composer} onSubmit={sendMessage}>
                <Input
                  id="chat-message-input"
                  label="Сообщение"
                  fieldClassName={styles.composerField}
                  autoComplete="off"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (sendError) setSendError(false);
                  }}
                  placeholder="Напишите сообщение"
                />
                <Button type={ButtonType.Submit}>Отправить</Button>
              </form>
            </>
          ) : (
            <EmptyState
              className={styles.noSelection}
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
