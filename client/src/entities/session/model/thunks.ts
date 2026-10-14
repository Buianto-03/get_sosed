import { createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../api/authService';

export const checkAuthThunk = createAsyncThunk('auth/checkAuthThunk', () =>
  authService.checkAuth(),
);
