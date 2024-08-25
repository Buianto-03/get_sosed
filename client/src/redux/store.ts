import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth/authSlice';
import advertReducer from './slices/adverts/advertsSlice';
import likeReducer from './slices/likes/likesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    advert: advertReducer,
    likes: likeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
