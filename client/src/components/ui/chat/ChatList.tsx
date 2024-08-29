import React from 'react';
import { Box, Avatar, AvatarBadge, Stack, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../redux/hooks';
import type { ChatListType } from '../../../types/chatList';
import { UserStatus } from '../../../types/auth';

type ChatListProps = {
  online: { id: number; name: string }[];
  receivers: ChatListType[];
};

export default function ChatList({ online, receivers }: ChatListProps): JSX.Element {
  const authorizedUser = useAppSelector((store) => store.auth.user);
  const navigate = useNavigate();

  const handleUserClick = (userId: number): void => {
    navigate(`/chat/${userId}`);
  };

  if (authorizedUser.status !== UserStatus.Logged) return <h2>Error! Проверь статус юзера</h2>;

  return (
    <Box w="100%" p={2}>
      {receivers.map((chat) => {
        const receiver = chat.receiverId === authorizedUser.id ? chat.sender : chat.receiver;
        const isOnline = online.some((user) => user.id === receiver.id);

        return (
          <Box
            key={`${chat.sender.id}-${chat.receiver.id}`}
            bg="#F3F3FF"
            p={2}
            color="black"
            borderRadius="10px"
            mb={1}
            cursor="pointer"
            _hover={{ bg: '#b0b0d6', color: 'white' }}
            _active={{ bg: '#9898c2' }}
            onClick={() => handleUserClick(receiver.id)}
          >
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar width="40px" height="40px">
                <AvatarBadge boxSize="1rem" bg={isOnline ? 'green.500' : 'red.500'} />
              </Avatar>
              <Text fontSize="md">{receiver.name}</Text>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}
