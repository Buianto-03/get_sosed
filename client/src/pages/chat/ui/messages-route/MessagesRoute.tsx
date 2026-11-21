import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { UserStatus } from '@entities/session/model/authModel';
import { ChatStatus } from '@entities/chat/model/chatListModel';
import {
  selectChatHistory,
  selectChatHistoryStatus,
  selectChatListError,
  selectChatListStatus,
  selectChatRows,
} from '@entities/chat/model/chatListSelectors';
import { getReceiverListThunk } from '@entities/chat/model/chatListThunk';
import { chatSocket } from '@entities/chat/model/socket';
import { routes } from '@shared/config/routes';
import { getMediaUrl } from '@shared/config/media';
import { ChatPage } from '../chat-page/ChatPage';
import { parseId, toConversationRow, toMessages } from './helper';
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
  const history = useAppSelector((state) => selectChatHistory(state, activeId));
  const historyStatus = useAppSelector((state) => selectChatHistoryStatus(state, activeId));
  const {
    summary,
    error: summaryError,
    loading: summaryLoading,
    retry: retrySummary,
  } = useDialogSummary(userId, activeId);
  const listing = useListingContext(userId, activeId, listingId);
  const summaryId = summary?.id ?? null;
  const retryHistory = useDialogHistory(userId, summaryId);
  const requestList = useCallback(() => {
    if (userId !== null) {
      void dispatch(getReceiverListThunk(userId));
    }
  }, [dispatch, userId]);
  useEffect(requestList, [requestList]);

  const selectConversation = useCallback(
    (other: string) => navigate(routes.messageThread(other)),
    [navigate],
  );
  const backToList = useCallback(() => navigate(routes.messages), [navigate]);
  const openListing = useCallback(
    (advert: string) => navigate(routes.listingDetails(advert)),
    [navigate],
  );
  const sendMessage = useCallback(
    (other: string, text: string) =>
      summaryId !== null && summaryId === Number(other) && chatSocket.sendMessage(summaryId, text),
    [summaryId],
  );

  const messages = useMemo(
    () => (userId === null ? [] : toMessages(history, userId)),
    [history, userId],
  );
  const conversations = useMemo(() => {
    if (userId === null) {
      return [];
    }
    const items = rows.map((row) => toConversationRow(row, userId));
    if (summary && !items.some((entry) => entry.id === String(summary.id))) {
      items.push({
        id: String(summary.id),
        name: summary.name,
        avatarUrl: getMediaUrl(summary.UserProfile?.photo),
        lastMessage: '',
      });
    }
    return items;
  }, [rows, summary, userId]);

  if (userId === null) {
    return null;
  }
  const historyLoading =
    summaryLoading ||
    (summary !== null &&
      (historyStatus === ChatStatus.Loading || historyStatus === ChatStatus.Idle));
  const historyError =
    (receiverId && activeId === null ? 'Недопустимый собеседник.' : summaryError) ||
    (historyStatus === ChatStatus.Error
      ? 'Не удалось загрузить историю. Проверьте соединение.'
      : '');

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
        onRetryHistory={summary ? retryHistory : retrySummary}
        onSelectConversation={selectConversation}
        onBackToList={backToList}
        onOpenListing={openListing}
        onSendMessage={sendMessage}
      />
    </div>
  );
}
