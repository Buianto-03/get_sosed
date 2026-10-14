import { createAsyncThunk } from '@reduxjs/toolkit';
import authService from '@entities/session/api/authService';
import { clearAuth } from '@entities/session/model/authSlice';

export const logoutThunk = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  await authService.logout();
  dispatch(clearAuth());
});
