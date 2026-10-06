import React, { useState } from 'react';
import { Avatar, Box, Button, Text, VStack } from '@chakra-ui/react';
import type { BackendUserT } from '@entities/session/model/auth';
import ProfileForm from '@features/edit-profile/ProfileForm';

export default function ProfileCard({ user, onPost }: {
  user: BackendUserT;
  onPost: () => void;
}): JSX.Element {
  const [editing, setEditing] = useState(false);
  return (
    <VStack spacing={3} p={4} bg="#CACAE2" borderRadius="md" h="100%">
      {editing ? <ProfileForm user={user} onClose={() => setEditing(false)} /> : (
        <Box textAlign="center">
          <Avatar size="2xl" name={user.name} src={user.UserProfile?.photo ?? undefined} />
          <Text fontWeight="bold" mt={3}>{user.name}</Text>
          <Text>{user.email}</Text>
          <Text>{user.UserProfile?.about}</Text>
          <Text>Возраст: {user.UserProfile?.age ?? '—'}</Text>
          <Text>Пол: {user.UserProfile?.gender ?? '—'}</Text>
          <Button mt={4} onClick={() => setEditing(true)}>Изменить профиль</Button>
        </Box>
      )}
      <Button onClick={onPost}>Разместить объявление</Button>
    </VStack>
  );
}
