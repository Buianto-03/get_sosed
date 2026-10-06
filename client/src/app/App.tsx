import React, { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router/router';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { checkAuthThunk } from '../entities/session/model/thunks';
import { chatSocket } from '../entities/chat/model/socket';
import { addMessage, clearChat, setMessages, setOnline } from '../entities/chat/model/chatListSlice';
import { UserStatus } from '../entities/session/model/auth';

function App(): JSX.Element {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user.status === UserStatus.Logged ? user.id : null;

  useEffect(() => {
    void dispatch(checkAuthThunk());
    // void dispatch(getAdvertsThunk());
    // dispatch getTagsByStringTagsThunk  <---
    // tags=Квартира,Кухня ->>> stringTags: ['Квартира', 'Кухня'] ->>> tags: [{id: 1, name: 'Квартира'}, {id: 2, name: 'Кухня'}]
    
  }, [dispatch]);

  useEffect(() => {
    if (userId === null) {
      chatSocket.disconnect();
      dispatch(clearChat());
      return undefined;
    }
    chatSocket.connect((action) => {
      switch (action.type) {
        case 'SET_USERS':
          dispatch(setOnline(action.payload));
          break;
        case 'SET_MESSAGES':
          dispatch(setMessages({ receiverId: action.receiverId, messages: action.payload }));
          break;
        case 'ADD_MESSAGE':
        case 'NEW_MESSAGE':
          dispatch(addMessage({
            userId: action.payload.senderId === userId
              ? action.payload.receiverId : action.payload.senderId,
            message: action.payload,
          }));
          break;
        default:
          break;
      }
    });
    return () => chatSocket.disconnect();
  }, [dispatch, userId]);

  return <Suspense fallback={<div>Загрузка...</div>}><RouterProvider router={router} /></Suspense>;
}

export default App;
