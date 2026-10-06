import { createAsyncThunk } from '@reduxjs/toolkit';
import userProfileService from './userProfileService';

export const editUserProfileThunk = createAsyncThunk(
  'userProfile/editUserProfileThunk',
  (formData: FormData) =>
    userProfileService.editUserProfile(formData),
);
