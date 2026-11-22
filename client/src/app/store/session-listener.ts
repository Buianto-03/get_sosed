import { chatSocket } from '@entities/chat/model/socket';
import { clearChat } from '@entities/chat/model/chatListSlice';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import { UserStatus, type UserT } from '@entities/session/model/authModel';
import { resetLikes } from '@entities/like/model/likesSlice';
import { resetSavedAdverts, savedLoadRequested } from '@entities/advert/model/likedAdvertsSlice';
import { SavedStatus } from '@entities/advert/model/likedAdvertsModel';
import { getLikedAdvertsThunk } from '@entities/advert/model/likedAdvertsThunk';
import type { AppDispatch, RootState } from './store';

const userId = (user: UserT): number | null => (user.status === UserStatus.Logged ? user.id : null);

export const sessionListener = createListenerMiddleware();
let savedRequest: ReturnType<ReturnType<typeof getLikedAdvertsThunk>> | undefined;

sessionListener.startListening.withTypes<RootState, AppDispatch>()({
  actionCreator: savedLoadRequested,
  effect: (_, api) => {
    const { auth, likedAdverts } = api.getState();
    if (
      userId(auth.user) === null ||
      likedAdverts.status === SavedStatus.Loading ||
      Object.keys(likedAdverts.pending).length > 0
    ) {
      return;
    }
    const request = api.dispatch(getLikedAdvertsThunk());
    savedRequest = request;
    void request.then(() => {
      if (savedRequest === request) {
        savedRequest = undefined;
      }
    });
  },
});

sessionListener.startListening.withTypes<RootState, AppDispatch>()({
  predicate: (_, current, previous) => userId(current.auth.user) !== userId(previous.auth.user),
  effect: (_, api) => {
    const id = userId(api.getState().auth.user);
    // No await: clear request IDs before the auth dispatch returns.
    savedRequest?.abort();
    savedRequest = undefined;
    chatSocket.disconnect();
    api.dispatch(clearChat());
    api.dispatch(resetSavedAdverts());
    api.dispatch(resetLikes(id));
    if (id !== null) {
      api.dispatch(savedLoadRequested());
    }
  },
});
