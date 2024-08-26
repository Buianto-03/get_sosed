import React, { useEffect, useRef } from 'react';
import { Box, VStack, Text, Flex } from '@chakra-ui/react';
import { useAppSelector } from '../../../redux/hooks';
import type { ChatType } from '../../../types/chat';
import { UserStatus } from '../../../types/auth';

type ChatComponentProps = {
  messages: ChatType[];
};

export default function ChatComponent({ messages }: ChatComponentProps): JSX.Element {
  const user = useAppSelector((store) => store.auth.user);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Прокрутка вниз при обновлении сообщений
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (user.status === UserStatus.Pending || user.status === UserStatus.Guest)
    return <h1>Loading...</h1>;

  return (
    <Box
      sx={{
        '&::-webkit-scrollbar': {
          width: '16px',
          borderRadius: '8px',
          backgroundColor: `rgba(0, 0, 0, 0.05)`,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: `rgba(0, 0, 0, 0.05)`,
        },
      }}
      w="100%"
      h="95%"
      p={4}
      bg="#f0f4f8"
      borderRadius="md"
      overflowY="auto"
      overflowX="hidden"
      scrollbar-width="thin"
      display="flex"
      flexDirection="column"
    >
      <VStack align="start" spacing={3} flex="1" overflowY="auto">
        {messages.map((message) => (
          <Flex
            key={message.senderId}
            justify={message.senderId === user?.id ? 'flex-end' : 'flex-start'}
            w="100%"
          >
            <Box
              bg={message.senderId === user?.id ? '#DDEEFF' : '#EDEDFF'}
              p={2}
              borderRadius="md"
              maxW="70%"
              boxShadow="md"
            >
              <Text>{message.message}</Text>
            </Box>
          </Flex>
        ))}
        <div ref={messagesEndRef} /> {/* Реф для автоматической прокрутки */}
      </VStack>
    </Box>
  );
}
