import type { RootState } from '@app/store/store';
import { createDraftSafeSelector } from '@reduxjs/toolkit';
import { UserStatus, type AuthState } from './authModel';

const selectAuthState = (state: RootState): AuthState => state.auth;

export const selectAuthUser = createDraftSafeSelector(selectAuthState, (state) => state.user);

export const selectIsLoggedIn = createDraftSafeSelector(
  selectAuthState,
  (state) => state.user.status === UserStatus.Logged,
);
