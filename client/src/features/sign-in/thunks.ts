import { createAsyncThunk } from '@reduxjs/toolkit';
import authService from '@entities/session/api/authService';
import { setSession } from '@entities/session/model/authSlice';
import type { LoginForm } from '@entities/session/model/auth';

export const signinThunk = createAsyncThunk('auth/signin', async (formData: LoginForm, { dispatch }) => {
  const session = await authService.submitLoginForm(formData);
  dispatch(setSession(session));
  return session;
});
