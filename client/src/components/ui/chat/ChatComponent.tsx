import React from 'react';
import { Box, VStack, Text, Flex } from '@chakra-ui/react';
import { useAppSelector } from '../../../redux/hooks';

type ChatComponentProps = {
  messages: {
    message: string;
    senderId: number;
    receiverId: number;
  }[];
};

export default function ChatComponent({ messages }: ChatComponentProps): JSX.Element {
  const user = useAppSelector((store) => store.auth.user);

  console.log(user);

  return (
    <Box w="100%" h="90%" p={4} overflowY="auto">
      <VStack align="start" spacing={3}>
        {messages.map((message, index) => (
          <Flex
            key={index}
            justify={message.senderId === user?.id ? 'flex-end' : 'flex-start'}
            w="100%"
          >
            <Box
              bg={message.senderId === user?.id ? '#DDEEFF' : '#EDEDFF'}
              p={2}
              borderRadius="md"
              maxW="70%"
            >
              <Text>{message.message}</Text>
            </Box>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
