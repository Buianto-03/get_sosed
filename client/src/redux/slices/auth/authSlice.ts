import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { UserStatus, type AuthState } from '../../../types/auth';
import { checkAuthThunk, signinThunk, signupThunk, logoutThunk } from './thunks';

const initialState: AuthState = {
  accessToken: '',
  user: { status: UserStatus.Pending },
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    clearAuth: (state) => {
      state.accessToken = '';
      state.user = { status: UserStatus.Guest };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(signinThunk.fulfilled, (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = { ...action.payload.user, status: UserStatus.Logged };
    });
    builder.addCase(signupThunk.fulfilled, (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = { ...action.payload.user, status: UserStatus.Logged };
    });
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.accessToken = '';
      state.user = { status: UserStatus.Guest };
    });
    builder.addCase(checkAuthThunk.fulfilled, (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = { ...action.payload.user, status: UserStatus.Logged };
    });
    builder.addCase(checkAuthThunk.rejected, (state) => {
      state.user = { status: UserStatus.Guest };
    });
  },
});

export const { setAccessToken, clearAuth } = authSlice.actions;

export default authSlice.reducer;
