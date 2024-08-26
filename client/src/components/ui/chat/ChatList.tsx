import React from 'react';
import { Box, Avatar, AvatarBadge, Stack, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../redux/hooks';

type ChatListProps = {
    online: { id: string; name: string }[];
}

export default function ChatList({ online }: ChatListProps): JSX.Element {
  const authorizedUser = useAppSelector((store) => store.auth.user);
  const navigate = useNavigate()

  const handleUserClick = (userId: string) => {
    // console.log('User clicked:', userId);
    navigate(`/chat/${userId}`)
    // Здесь можно добавить логику обработки клика по пользователю
  };

  return (
    <Box w="100%" p={2}>
      {online
        .filter((user) => user.id !== authorizedUser.id)
        .map((user) => (
          <Box
            key={user.id}
            bg="#cacae2"
            p={2}
            color="white"
            borderRadius="10px"
            mb={1} // добавляет отступ между боксами
            cursor="pointer" // меняет курсор на указатель при наведении
            _hover={{ bg: '#b0b0d6' }} // изменяет цвет фона при наведении
            _active={{ bg: '#9898c2' }} // изменяет цвет фона при клике
            onClick={() => handleUserClick(user.id)}
          >
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar width="40px" height="40px">
                <AvatarBadge boxSize="1rem" bg="green.500" />
              </Avatar>
              <Text fontSize="md">{user.name}</Text>
            </Stack>
          </Box>
        ))}
    </Box>
  );
}
