import { useEffect } from 'react';
import { chatSocket } from '@entities/chat/model/socket';
import {
  addMessage,
  clearChat,
  setMessages,
  setOnline,
  setChatConnection,
  historyFailed,
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
            dispatch(historyFailed(action.receiverId));
            break;
          case 'SET_USERS':
            dispatch(setOnline(action.payload));
            break;
          case 'SET_MESSAGES':
            dispatch(setMessages({ receiverId: action.receiverId, messages: action.payload }));
            break;
          case 'ADD_MESSAGE':
          case 'NEW_MESSAGE':
            dispatch(
              addMessage({
                userId:
                  action.payload.senderId === userId
                    ? action.payload.receiverId
                    : action.payload.senderId,
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
