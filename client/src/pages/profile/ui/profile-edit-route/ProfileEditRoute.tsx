import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import {
  ProfileEditForm,
  type ProfileEditData,
} from '@features/edit-profile/ui/profile-edit-form/ProfileEditForm';
import { editUserProfileThunk } from '@features/edit-profile/thunks';
import { updateUser } from '@entities/session/model/authSlice';
import { UserStatus } from '@entities/session/model/authModel';
import { routes } from '@shared/config/routes';
import { toProfile } from '../../helper';
import styles from './ProfileEditRoute.module.scss';

export default function ProfileEditRoute(): JSX.Element | null {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  if (user.status !== UserStatus.Logged) return null;
  const save = async (profile: ProfileEditData, avatar: File | null | undefined): Promise<void> => {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setError('');
    const data = new FormData();
    data.set('id', String(user.id));
    data.set('name', profile.name);
    data.set('city', profile.city ?? '');
    data.set('intent', profile.intent ?? '');
    data.set('about', profile.description ?? '');
    data.set('habits', JSON.stringify(profile.habits ?? []));
    data.set('age', profile.age ?? '');
    data.set('phoneNumber', profile.phoneNumber ?? '');
    if (avatar instanceof File) data.set('photo', avatar);
    if (avatar === null) data.set('removePhoto', 'true');
    try {
      const updated = await dispatch(editUserProfileThunk(data)).unwrap();
      dispatch(updateUser(updated));
      navigate(routes.profile);
    } catch {
      setError('Не удалось сохранить профиль. Попробуйте ещё раз.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };
  return (
    <div className={styles.profile__edit}>
      <ProfileEditForm
        key={user.id}
        profile={{
          ...toProfile(user),
          age: String(user.UserProfile?.age ?? ''),
          phoneNumber: user.UserProfile?.phoneNumber ?? '',
        }}
        saving={saving}
        error={error}
        onCancel={() => navigate(routes.profile)}
        onSave={(profile, avatar) => {
          void save(profile, avatar);
        }}
      />
    </div>
  );
}
