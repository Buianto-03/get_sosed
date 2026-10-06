import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormErrorMessage, FormLabel, Input, Text, VStack,
} from '@chakra-ui/react';
import { z } from 'zod';
import { useAppDispatch } from '@app/store/hooks';
import type { BackendUserT } from '@entities/session/model/auth';
import { checkAuthThunk } from '@entities/session/model/thunks';
import { editUserProfileThunk } from './thunks';

const profileSchema = z.object({
  age: z.coerce.number().int().min(18).max(100),
  about: z.string().min(10),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
});

type ProfileFields = { age: string; about: string; phoneNumber: string };
type ProfileField = keyof ProfileFields;

export default function ProfileForm({ user, onClose }: {
  user: BackendUserT;
  onClose: () => void;
}): JSX.Element {
  const dispatch = useAppDispatch();
  const [fields, setFields] = useState<ProfileFields>({
    age: String(user.UserProfile?.age ?? ''),
    about: user.UserProfile?.about ?? '',
    phoneNumber: user.UserProfile?.phoneNumber ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [requestError, setRequestError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const result = profileSchema.safeParse(fields);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      setErrors({
        age: details.age?.[0] ? 'Возраст должен быть от 18 до 100 лет.' : '',
        about: details.about?.[0] ? 'Расскажите о себе не менее чем в 10 символах.' : '',
        phoneNumber: details.phoneNumber?.[0] ? 'Введите номер телефона в международном формате.' : '',
      });
      return;
    }
    setErrors({});
    setRequestError('');
    const formData = new FormData(event.currentTarget);
    formData.append('id', String(user.id));
    setSaving(true);
    try {
      await dispatch(editUserProfileThunk(formData)).unwrap();
      await dispatch(checkAuthThunk()).unwrap();
      onClose();
    } catch {
      setRequestError('Не удалось сохранить профиль.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box as="form" onSubmit={(event: React.FormEvent<HTMLFormElement>) => { void submit(event); }}>
      <VStack spacing={3}>
        <FormControl>
          <FormLabel>Фото</FormLabel>
          <Input name="photo" type="file" accept="image/*" />
        </FormControl>
        {(['age', 'about', 'phoneNumber'] as const).map((field) => (
          <FormControl key={field} isInvalid={Boolean(errors[field])}>
            <FormLabel>{({ age: 'Возраст', about: 'О себе', phoneNumber: 'Номер телефона' })[field]}</FormLabel>
            <Input
              name={field}
              type={field === 'age' ? 'number' : 'text'}
              value={fields[field]}
              onChange={(event) => setFields((previous) => ({ ...previous, [field]: event.target.value }))}
              bg="white"
            />
            <FormErrorMessage>{errors[field]}</FormErrorMessage>
          </FormControl>
        ))}
        {requestError && <Text color="red.500" role="alert">{requestError}</Text>}
        <Button type="submit" colorScheme="teal" isLoading={saving}>Сохранить</Button>
        <Button onClick={onClose}>Отменить</Button>
      </VStack>
    </Box>
  );
}
