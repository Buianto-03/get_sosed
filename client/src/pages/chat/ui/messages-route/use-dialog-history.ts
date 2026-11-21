import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import type { DialogHistory } from '@entities/chat/model/chatListModel';
import { selectChatHistory, selectChatConnection } from '@entities/chat/model/chatListSelectors';
import {
  closeHistory,
  loadOlderHistory,
  openHistory,
  retryHistory,
} from '@entities/chat/model/chatListSlice';

interface DialogHistoryResult {
  history: DialogHistory | null;
  connected: boolean;
  retry: () => void;
  loadOlder: () => void;
}

export function useDialogHistory(
  ownerId: number | null,
  receiverId: number | null,
): DialogHistoryResult {
  const dispatch = useAppDispatch();
  const history = useAppSelector((state) => selectChatHistory(state, ownerId, receiverId));
  const connected = useAppSelector(selectChatConnection);
  useEffect(() => {
    if (ownerId === null || receiverId === null) {
      return undefined;
    }
    const dialog = { ownerId, receiverId };
    dispatch(openHistory(dialog));
    return () => {
      dispatch(closeHistory(dialog));
    };
  }, [dispatch, ownerId, receiverId]);

  const retry = useCallback(() => {
    if (ownerId !== null && receiverId !== null) {
      dispatch(retryHistory({ ownerId, receiverId }));
    }
  }, [dispatch, ownerId, receiverId]);
  const loadOlder = useCallback(() => {
    if (ownerId !== null && receiverId !== null) {
      dispatch(loadOlderHistory({ ownerId, receiverId }));
    }
  }, [dispatch, ownerId, receiverId]);

  return { history, connected, retry, loadOlder };
}
