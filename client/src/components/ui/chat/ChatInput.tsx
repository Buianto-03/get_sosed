import React, { useState } from 'react';
import { Box, Input, Button, HStack } from '@chakra-ui/react';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
};

export default function ChatInput({ onSendMessage }: ChatInputProps): JSX.Element {
  const [message, setMessage] = useState('');

  const handleSendMessage = (): void => {
    if (message.trim() !== '') {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <Box w="100%" p={2}>
      <HStack spacing={2}>
        <Input
          boxShadow="md"
          borderRadius="md"
          _focus={{ boxShadow: 'outline' }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          placeholder="Type your message..."
        />
        <Button onClick={handleSendMessage} colorScheme="teal">
          Send
        </Button>
      </HStack>
    </Box>
  );
}
