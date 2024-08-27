import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth/authSlice';
import advertReducer from './slices/adverts/advertsSlice';
import likeReducer from './slices/likes/likesSlice';
import userProfileReducer from './slices/userProfile/userProfileSlice';
import chatListReducer from './slices/chat/chatListSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    advert: advertReducer,
    likes: likeReducer,
    userProfile: userProfileReducer,
    chatList: chatListReducer

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
