import { createAsyncThunk } from '@reduxjs/toolkit';
import type { UserProfileT } from '../../../types/userProfile';
import userProfileService from '../../../services/userProfileService';
import type { BackendUserT } from '../../../types/auth';

export const editUserProfileThunk = createAsyncThunk(
  'userProfile/editUserProfileThunk',
  ({ formData, id }: { formData: UserProfileT; id: BackendUserT['id'] }) =>
    userProfileService.editUserProfile({ ...formData, id }),
);

export const a = 3;
