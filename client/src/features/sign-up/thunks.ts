import { createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../entities/session/api/authService';
import { setSession } from '../../entities/session/model/authSlice';

export const signupThunk = createAsyncThunk('auth/signup', async (formData: FormData, { dispatch }) => {
  const session = await authService.submitSignUpForm(formData);
  dispatch(setSession(session));
  return session;
});
