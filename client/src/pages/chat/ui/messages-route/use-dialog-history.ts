import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch } from '@app/store/hooks';
import { historyStarted } from '@entities/chat/model/chatListSlice';
import { chatSocket } from '@entities/chat/model/socket';

export function useDialogHistory(ownerId: number | null, receiverId: number | null): () => void {
  const dispatch = useAppDispatch();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (ownerId === null || receiverId === null) {
      return undefined;
    }
    dispatch(historyStarted(receiverId));
    chatSocket.openDialog(receiverId);
    return () => chatSocket.closeDialog(receiverId);
  }, [dispatch, ownerId, receiverId, attempt]);

  return useCallback(() => setAttempt((value) => value + 1), []);
}
