import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { UserProfileT } from '../../../types/userProfile';
import { editUserProfileThunk } from './thunks';

const initialState: UserProfileT = {
  id: null,
  age: null,
  about: '',
  phoneNumber: '',
  photo: '',
};

export const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      editUserProfileThunk.fulfilled,
      (state, action: PayloadAction<UserProfileT>) => {
        state.id = action.payload.id;
        state.age = action.payload.age;
        state.about = action.payload.about;
        state.phoneNumber = action.payload.phoneNumber;
        state.photo = action.payload.photo;
      },
    );
  },
});

export default userProfileSlice.reducer;
