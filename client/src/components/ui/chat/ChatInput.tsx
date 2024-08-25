import React, { useState } from 'react';
import { Box, Input, Button, HStack } from '@chakra-ui/react';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps): JSX.Element {
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = (): void => {
    if (inputValue.trim() !== '') {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <Box w="100%" p={2}>
      <HStack spacing={2}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
        />
        <Button onClick={handleSendMessage} colorScheme="teal">
          Send
        </Button>
      </HStack>
    </Box>
  );
}