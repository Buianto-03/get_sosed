import React, { useEffect, useId, useState } from 'react';
import { useFormFeedback } from '@shared/lib/forms/use-form-feedback';
import { LuArrowLeft } from 'react-icons/lu';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Avatar, AvatarSize } from '@shared/ui/avatar/Avatar';
import { Button, ButtonType, ButtonVariant } from '@shared/ui/button/Button';
import { FilePicker, FilePickerAccept } from '@shared/ui/file-picker/FilePicker';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { Input } from '@shared/ui/input/Input';
import { Surface, SurfacePadding } from '@shared/ui/surface/Surface';
import { Textarea } from '@shared/ui/textarea/Textarea';
import { validateProfileEdit, type ProfileEditValues, type ProfileEditErrors } from './helper';
import styles from './ProfileEditForm.module.scss';

export type ProfileEditData = {
  name: string;
  city?: string;
  intent?: string;
  description?: string;
  habits?: readonly string[];
  avatarUrl?: string;
  age?: string;
  phoneNumber?: string;
};

export interface ProfileEditFormProps {
  profile: ProfileEditData | null;
  onSave: (profile: ProfileEditData, avatarFile: File | null | undefined) => void;
  onCancel: () => void;
  saving?: boolean;
  error?: string;
}

export function ProfileEditForm({
  profile,
  onSave,
  onCancel,
  saving = false,
  error,
}: ProfileEditFormProps): JSX.Element {
  const id = useId();
  const { formRef, requestFeedbackFocus } = useFormFeedback(saving);
  const [values, setValues] = useState<ProfileEditValues>({
    name: profile?.name ?? '',
    age: profile?.age ?? '',
    phoneNumber: profile?.phoneNumber ?? '',
    city: profile?.city ?? '',
    intent: profile?.intent ?? '',
    description: profile?.description ?? '',
    habits: profile?.habits?.join(', ') ?? '',
  });
  const [errors, setErrors] = useState<ProfileEditErrors>({});
  const [avatarFile, setAvatarFile] = useState<File | null | undefined>();
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>();
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    if (!(avatarFile instanceof File)) {
      setAvatarPreviewUrl(undefined);
      return undefined;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const change = (field: keyof ProfileEditValues, value: string): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const selectPhoto = (files: File[]): void => {
    const file = files[0];
    if (!file) {
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Выберите фото в формате JPG, PNG или WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Фото должно быть не больше 5 МБ.');
      return;
    }
    setAvatarFile(file);
    setPhotoError('');
  };

  const submit = (): void => {
    if (saving) {
      return;
    }
    const nextErrors = validateProfileEdit(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || photoError) {
      return;
    }
    onSave(
      {
        name: values.name.trim(),
        age: values.age,
        phoneNumber: values.phoneNumber,
        city: values.city.trim(),
        intent: values.intent.trim(),
        description: values.description.trim(),
        habits: values.habits
          .split(',')
          .map((habit) => habit.trim())
          .filter(Boolean),
        avatarUrl: profile?.avatarUrl,
      },
      avatarFile,
    );
  };

  const visibleAvatarUrl = avatarFile === null ? undefined : avatarPreviewUrl ?? profile?.avatarUrl;

  return (
    <main className={styles.page}>
      <Button className={styles.back} variant={ButtonVariant.Text} onClick={onCancel}>
        <LuArrowLeft aria-hidden="true" />К профилю
      </Button>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Личный кабинет</p>
        <Heading level={HeadingLevel.H1} size={HeadingSize.Xl}>
          Редактирование профиля
        </Heading>
        <p>Расскажите о себе, чтобы людям было проще познакомиться с вами.</p>
      </div>
      <Surface padding={SurfacePadding.None} className={styles.surface}>
        <form
          ref={formRef}
          aria-busy={saving || undefined}
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            requestFeedbackFocus();
            submit();
          }}
        >
          <fieldset disabled={saving} className={styles.profile__fieldset}>
            <div className={styles.avatarSection}>
              <Avatar
                name={values.name || 'Новый пользователь'}
                src={visibleAvatarUrl}
                size={AvatarSize.Xl}
              />
              <div className={styles.avatarActions}>
                <strong>Фото профиля</strong>
                <p>JPG, PNG или WebP, до 5 МБ.</p>
                <div className={styles.avatarButtons}>
                  <FilePicker
                    id={`${id}-avatar`}
                    label="Выбрать фото"
                    accept={[FilePickerAccept.Jpeg, FilePickerAccept.Png, FilePickerAccept.Webp]}
                    onFilesSelected={selectPhoto}
                  />
                  {visibleAvatarUrl && (
                    <Button
                      variant={ButtonVariant.Text}
                      onClick={() => {
                        setAvatarFile(null);
                        setPhotoError('');
                        document
                          .getElementById(`${id}-avatar`)
                          ?.parentElement?.querySelector('button')
                          ?.focus();
                      }}
                    >
                      Удалить фото
                    </Button>
                  )}
                </div>
                {photoError && (
                  <p className={styles.photoError} role="alert">
                    {photoError}
                  </p>
                )}
              </div>
            </div>
            <div className={styles.fields}>
              <Input
                id={`${id}-name`}
                label="Имя"
                required
                autoComplete="name"
                value={values.name}
                error={errors.name}
                onChange={(event) => change('name', event.target.value)}
              />
              <Input
                id={`${id}-city`}
                label="Город"
                required
                autoComplete="address-level2"
                value={values.city}
                error={errors.city}
                onChange={(event) => change('city', event.target.value)}
              />
              <Input
                id={`${id}-intent`}
                label="Что вы ищете"
                value={values.intent}
                onChange={(event) => change('intent', event.target.value)}
              />
              <Textarea
                id={`${id}-description`}
                label="О себе"
                required
                rows={5}
                maxLength={501}
                value={values.description}
                error={errors.description}
                hint="От 10 до 500 символов."
                onChange={(event) => change('description', event.target.value)}
              />
              <Input
                id={`${id}-habits`}
                label="Привычки и предпочтения"
                hint="Разделяйте привычки запятой."
                value={values.habits}
                error={errors.habits}
                onChange={(event) => change('habits', event.target.value)}
              />
            </div>
            <details>
              <summary>Дополнительные сведения</summary>
              <Input
                id={`${id}-age`}
                label="Возраст"
                value={values.age}
                error={errors.age}
                onChange={(event) => change('age', event.target.value)}
              />
              <Input
                id={`${id}-phone`}
                label="Телефон"
                value={values.phoneNumber}
                error={errors.phoneNumber}
                onChange={(event) => change('phoneNumber', event.target.value)}
              />
            </details>
          </fieldset>
          {error && <Alert variant={AlertVariant.Error}>{error}</Alert>}
          {saving && <p role="status">Сохраняем профиль…</p>}
          <div className={styles.actions}>
            <Button type={ButtonType.Submit} loading={saving}>
              Сохранить изменения
            </Button>
            <Button variant={ButtonVariant.Secondary} disabled={saving} onClick={onCancel}>
              Отменить
            </Button>
          </div>
        </form>
      </Surface>
    </main>
  );
}
