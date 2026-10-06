import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../entities/session/model/authSlice';
import advertReducer from '../../entities/advert/model/advertsSlice';
import likeReducer from '../../entities/like/model/likesSlice';
import chatListReducer from '../../entities/chat/model/chatListSlice'
import likedAdvertsReducer from '../../features/liked-adverts/model';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    advert: advertReducer,
    likes: likeReducer,
    chatList: chatListReducer,
    likedAdverts: likedAdvertsReducer,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
