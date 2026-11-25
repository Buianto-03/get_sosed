import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@entities/session/model/authSlice';
import { listingReducer, likedListingsReducer, tagCatalogReducer } from '@entities/listing/model';
import likeReducer from '@entities/like/model/likesSlice';
import chatListReducer from '@entities/chat/model/chatListSlice';
import { chatHistoryListener } from './chat-history-listener';
import { sessionListener } from './session-listener';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    listing: listingReducer,
    likes: likeReducer,
    chatList: chatListReducer,
    likedListings: likedListingsReducer,
    tagCatalog: tagCatalogReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(sessionListener.middleware, chatHistoryListener.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
