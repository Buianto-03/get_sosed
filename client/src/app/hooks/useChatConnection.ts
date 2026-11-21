import { useEffect } from 'react';
import { chatSocket } from '@entities/chat/model/socket';
import {
  addMessage,
  clearChat,
  historyReceived,
  setOnline,
  setChatConnection,
  historyFailed,
  chatSendFailed,
} from '@entities/chat/model/chatListSlice';
import { UserStatus } from '@entities/session/model/authModel';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export function useChatConnection(): void {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user.status === UserStatus.Logged ? user.id : null;

  useEffect(() => {
    if (userId === null) {
      chatSocket.disconnect();
      dispatch(clearChat());
      return undefined;
    }
    chatSocket.connect(
      (action) => {
        switch (action.type) {
          case 'CHAT_ERROR':
            if (action.requestId !== undefined) {
              dispatch(
                historyFailed({ receiverId: action.receiverId, requestId: action.requestId }),
              );
            } else {
              dispatch(chatSendFailed({ ownerId: userId, receiverId: action.receiverId }));
            }
            break;
          case 'SET_USERS':
            dispatch(setOnline(action.payload));
            break;
          case 'HISTORY_PAGE':
            dispatch(historyReceived(action));
            break;
          case 'ADD_MESSAGE':
          case 'NEW_MESSAGE':
            dispatch(
              addMessage({
                ownerId: userId,
                message: action.payload,
              }),
            );
            break;
          default:
            break;
        }
      },
      (connected) => dispatch(setChatConnection(connected)),
    );
    return () => chatSocket.disconnect();
  }, [dispatch, userId]);
}
