import { createAsyncThunk } from '@reduxjs/toolkit';
import userProfileService from '../../../services/userProfileService';

export const editUserProfileThunk = createAsyncThunk(
  'userProfile/editUserProfileThunk',
  (formData: FormData) =>
    userProfileService.editUserProfile(formData),
);

export const a = 3;
