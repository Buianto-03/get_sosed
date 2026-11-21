import { UserStatus, type AuthState, type UserT } from './authModel';

interface AuthRoot {
  auth: AuthState;
}

export const selectAuthUser = (state: AuthRoot): UserT => state.auth.user;
export const selectIsLoggedIn = (state: AuthRoot): boolean =>
  selectAuthUser(state).status === UserStatus.Logged;
