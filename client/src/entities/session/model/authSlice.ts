import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { UserStatus, type AuthState, type AuthSchemaT, type BackendUserT } from './authModel';
import { checkAuthThunk } from './authThunk';

const initialState: AuthState = {
  accessToken: '',
  user: { status: UserStatus.Pending },
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthSchemaT>) => {
      state.accessToken = action.payload.accessToken;
      state.user = { ...action.payload.user, status: UserStatus.Logged };
    },
    updateUser: (state, action: PayloadAction<BackendUserT>) => {
      if (state.user.status === UserStatus.Logged && state.user.id === action.payload.id)
        state.user = { ...action.payload, status: UserStatus.Logged };
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    clearAuth: (state) => {
      state.accessToken = '';
      state.user = { status: UserStatus.Guest };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(checkAuthThunk.fulfilled, (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = { ...action.payload.user, status: UserStatus.Logged };
    });
    builder.addCase(checkAuthThunk.rejected, (state) => {
      state.user = { status: UserStatus.Guest };
    });
  },
});

export const { setSession, setAccessToken, clearAuth, updateUser } = authSlice.actions;

export default authSlice.reducer;
