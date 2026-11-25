import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { UserStatus } from '@entities/session/model/authModel';
import { ChatStatus } from '@entities/chat/model/chatListModel';
import {
  selectChatListError,
  selectChatListStatus,
  selectChatRows,
} from '@entities/chat/model/chatListSelectors';
import { getReceiverListThunk } from '@entities/chat/model/chatListThunk';
import { chatSocket } from '@entities/chat/model/socket';
import { routes } from '@shared/config/routes';
import { ChatPage } from '../chat-page/ChatPage';
import { buildConversationRows, parseId, toMessages } from './helper';
import { useDialogHistory } from './use-dialog-history';
import { useDialogSummary } from './use-dialog-summary';
import { useListingContext } from './use-listing-context';
import styles from './MessagesRoute.module.scss';

export default function MessagesRoute(): JSX.Element | null {
  const { receiverId } = useParams();
  const [params] = useSearchParams();
  const listingId = parseId(params.get('listingId'));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const userId = useAppSelector(({ auth }) =>
    auth.user.status === UserStatus.Logged ? auth.user.id : null,
  );
  const id = parseId(receiverId);
  const activeId = id !== userId ? id : null;
  const rows = useAppSelector(selectChatRows);
  const listStatus = useAppSelector(selectChatListStatus);
  const listError = useAppSelector(selectChatListError);
  const {
    summary,
    error: summaryError,
    loading: summaryLoading,
    retry: retrySummary,
  } = useDialogSummary(userId, activeId);
  const listing = useListingContext(userId, activeId, listingId);
  const summaryId = summary?.id ?? null;
  const { history, connected, loadOlder, retry } = useDialogHistory(userId, summaryId);
  const listRequest = useRef<ReturnType<ReturnType<typeof getReceiverListThunk>>>();
  const requestList = useCallback(() => {
    listRequest.current?.abort();
    if (userId !== null) {
      listRequest.current = dispatch(getReceiverListThunk(userId));
    }
  }, [dispatch, userId]);
  useEffect(() => {
    requestList();
    return () => listRequest.current?.abort();
  }, [requestList]);

  const selectConversation = useCallback(
    (other: string) => navigate(routes.messageThread(other)),
    [navigate],
  );
  const openListing = useCallback(
    (advert: string) => navigate(routes.listingDetails(advert)),
    [navigate],
  );
  const sendMessage = useCallback(
    (other: string, text: string) =>
      summaryId !== null && summaryId === Number(other) && chatSocket.sendMessage(summaryId, text),
    [summaryId],
  );

  const historyMessages = history?.messages;
  const messages = useMemo(
    () => (userId !== null && historyMessages ? toMessages(historyMessages, userId) : []),
    [historyMessages, userId],
  );
  const conversations = useMemo(
    () => buildConversationRows(rows, summary, userId),
    [rows, summary, userId],
  );

  if (userId === null) {
    return null;
  }
  const historyLoading =
    summaryLoading || (summary !== null && !history?.initialized && !history?.failed);
  const historyError =
    (receiverId && activeId === null ? 'Недопустимый собеседник.' : summaryError) ||
    (history?.failed ? 'Не удалось загрузить историю. Проверьте соединение.' : '');

  return (
    <div className={styles.messages__route}>
      <ChatPage
        key={userId}
        conversations={conversations}
        selectedConversationId={receiverId ?? null}
        messages={messages}
        listing={summary ? listing : undefined}
        listLoading={listStatus === ChatStatus.Loading}
        listError={listError}
        onRetryList={requestList}
        historyLoading={historyLoading}
        historyError={historyError}
        onRetryHistory={summary ? retry : retrySummary}
        awaitingConnection={Boolean(history && !connected)}
        sendFailed={history?.sendFailed}
        hasOlder={history?.beforeCursor != null}
        olderDisabled={!connected || Boolean(history?.pending || history?.failed)}
        onLoadOlder={loadOlder}
        lastPageId={history?.lastPageId}
        lastOlderPageId={history?.lastOlderPageId}
        onSelectConversation={selectConversation}
        onOpenListing={openListing}
        onSendMessage={sendMessage}
      />
    </div>
  );
}
