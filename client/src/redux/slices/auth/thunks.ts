import { createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../../services/authService';
import type { LoginForm } from '../../../types/auth';

export const signinThunk = createAsyncThunk('auth/signinThunk', (formData: LoginForm) =>
  authService.submitLoginForm(formData),
);

export const signupThunk = createAsyncThunk('auth/signupThunk', (formData: FormData) =>
  authService.submitSignUpForm(formData),
);

export const checkAuthThunk = createAsyncThunk('auth/checkAuthThunk', () =>
  authService.checkAuth(),
);

export const logoutThunk = createAsyncThunk('auth/logoutThunk', () =>
  authService.logout(),
);
