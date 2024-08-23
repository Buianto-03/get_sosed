import React from 'react';
import { Box, Avatar, AvatarBadge, Stack, Text } from '@chakra-ui/react';

type ChatListProps = {
    online: []
}

export default function ChatList({online}: ChatListProps): JSX.Element {

  return (
    <Box bg="tomato" w="100%" p={4} color="white" borderRadius="20px">
      {online.map((user) => (
        <Stack direction="row" alignItems="center" spacing={3}>
          <Avatar width="40px" height="40px" marginBottom={4}>
            <AvatarBadge boxSize="1rem" bg="green.500" />
          </Avatar>
          <Text fontSize="md">{user.name}</Text>
        </Stack>
      ))}
      {/* <Stack direction="column" spacing={4}>
        <Stack direction="row" alignItems="center" spacing={3}>
          <Avatar width="40px" height="40px">
            <AvatarBadge boxSize="1rem" bg="green.500" />
          </Avatar>
          <Text fontSize="md">User1</Text>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={3}>
          <Avatar width="40px" height="40px">
            <AvatarBadge boxSize="1rem" bg="red.500" />
          </Avatar>
          <Text fontSize="md">User2</Text>
        </Stack>
      </Stack> */}
    </Box>
  );
}
