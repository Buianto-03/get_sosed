import React, { useEffect, useRef, useState } from 'react';
import { Grid, GridItem, Container, Image, Box, Text, VStack } from '@chakra-ui/react';
import { useAppSelector } from '../../../redux/hooks';
import ChatComponent from '../../ui/chat/ChatComponent';
import ChatList from '../../ui/chat/ChatList';
import ChatInput from '../../ui/chat/ChatInput';

export default function AccountPage(): JSX.Element {
  const user = useAppSelector((store) => store.auth.user);
  const [online, setOnline] = useState([]);
  const [messages, setMessages] = useState<string[]>([]);
  const soketRef = useRef(null);

  useEffect(() => {
    const soket = new WebSocket('http://localhost:3000');
    soketRef.current = soket;
    soket.onopen = () => console.log('CONNECTED');
    soket.onclose = () => console.log('DISCONNECTED');
    soket.onerror = (err) => console.log('ERROR', err);
    soket.onmessage = (event) => {
      const action = JSON.parse(event.data);
      const { type, payload } = action;
      switch (type) {
        case 'SET_USERS':
          setOnline(payload);
          break;

        case 'SET_MESSAGES':
          setMessages(payload);
          break;
        case 'NEW_MESSAGES':
          setMessages(payload);
          break;
        case 'ADD_MESSAGE':
          setMessages((prevMessages) => [...prevMessages, payload]);
          break;
        default:
          break;
      }
    };
    return () => {
      soketRef.current.close();
    };
  }, []);

  console.log(messages);
  

  const sendNewMessage = (message: string) => {
    const action = {
      type: 'ADD_MESSAGE',
      payload: message,
    };
    soketRef.current.send(JSON.stringify(action));
  };

  const handleSendMessage = (message: string) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };
  console.log(messages);

  return (
    <Container p={4} maxW="container.xl" display="flex" justifyContent="center" height="100vh">
      <Grid
        templateRows={{ base: 'repeat(3, 1fr)', md: 'repeat(2, 1fr)' }}
        templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(5, 1fr)' }}
        gap={4}
        w={{ base: '100%', md: '1225px' }}
        h={{ base: 'auto', md: '650px' }}
      >
        <GridItem
          rowSpan={{ base: 1, md: 2 }}
          colSpan={{ base: 1, md: 1 }}
          bg="tomato"
          p={4}
          borderRadius="md"
          boxShadow="lg"
        >
          <VStack spacing={2} alignItems="center" mt={4}>
            <Image
              borderRadius="full"
              mb={4}
              maxW={{ base: '100px', md: '150px' }}
              maxH={{ base: '100px', md: '150px' }}
              w="100%"
              h="auto"
              src="https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png"
              alt="User Avatar"
            />
            <Text fontSize="lg" fontWeight="bold" color="white">
              {user.name}
            </Text>
            <Text fontSize="md" color="whiteAlpha.800">
              {user.email}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.700">
              {user?.UserProfile?.about}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.700">
              Age: {user?.UserProfile?.age}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.700">
              Gender: {user?.UserProfile?.gender}
            </Text>
          </VStack>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 2 }} bg="papayawhip" borderRadius="md" boxShadow="lg">
          <ChatList online={online} />
        </GridItem>
        <GridItem
          rowSpan={{ base: 1, md: 2 }}
          colSpan={{ base: 1, md: 2 }}
          bg="#EDEDFF"
          borderRadius="md"
          boxShadow="lg"
          display="flex"
          flexDirection="column"
        >
          <ChatComponent online={online} messages={messages} />
          <ChatInput onSendMessage={sendNewMessage} />
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 2 }} bg="tomato" borderRadius="md" boxShadow="lg" />
      </Grid>
    </Container>
  );
}
