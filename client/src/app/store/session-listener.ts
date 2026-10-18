import { createListenerMiddleware } from '@reduxjs/toolkit';
import { UserStatus, type UserT } from '@entities/session/model/auth';
import { resetLikes } from '@entities/like/model/likesSlice';
import { resetSavedAdverts } from '@entities/advert/model/likedAdvertsSlice';
import { getLikedAdvertsThunk } from '@entities/advert/model/likedAdvertsThunk';
import type { AppDispatch, RootState } from './store';

const userId = (user: UserT): number | null =>
  user.status === UserStatus.Logged ? user.id : null;

export const sessionListener = createListenerMiddleware();

sessionListener.startListening.withTypes<RootState, AppDispatch>()({
  predicate: (_, current, previous) => userId(current.auth.user) !== userId(previous.auth.user),
  effect: (_, api) => {
    const id = userId(api.getState().auth.user);
    // No await: clear request IDs before the auth dispatch returns.
    api.dispatch(resetSavedAdverts());
    api.dispatch(resetLikes(id));
    if (id !== null) void api.dispatch(getLikedAdvertsThunk());
  },
});
