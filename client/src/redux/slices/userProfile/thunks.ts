import { createAsyncThunk } from '@reduxjs/toolkit';
import type { UserProfileT } from '../../../types/userProfile';
import userProfileService from '../../../services/userProfileService';
import type { BackendUserT } from '../../../types/auth';

export const editUserProfileThunk = createAsyncThunk(
  'userProfile/editUserProfileThunk',
  (formData: FormData) =>
    userProfileService.editUserProfile(formData),
);

export const a = 3;
