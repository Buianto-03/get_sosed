import { isAxiosError } from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import authService from '@entities/session/api/authService';
import { setSession } from '@entities/session/model/authSlice';

export const signupThunk = createAsyncThunk('auth/signup', async (formData: FormData, { dispatch, rejectWithValue }) => {
  try {
    const session = await authService.submitSignUpForm(formData);
    dispatch(setSession(session));
    return session;
  } catch (error) {
    if (isAxiosError<{ code?: string }>(error) && error.response?.status === 409
      && error.response.data?.code === 'EMAIL_ALREADY_EXISTS') {
      return rejectWithValue('EMAIL_ALREADY_EXISTS');
    }
    throw error;
  }
});
