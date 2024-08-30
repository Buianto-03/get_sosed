import React, { useEffect, useRef, useState } from 'react';
import { Grid, GridItem, Container, Image, Text, Box } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../../redux/hooks';
import ChatComponent from '../../ui/chat/ChatComponent';
import ChatInput from '../../ui/chat/ChatInput';
import { UserStatus, type BackendUserT } from '../../../types/auth';
import type { ChatType } from '../../../types/chat';

type Action = {
  type: string;
  payload: BackendUserT[] | ChatType[] | ChatType | {text: string, receiverId: number};
};

export default function ChatPage(): JSX.Element {
  const { receiverId } = useParams<{receiverId: string}>();
  const user = useAppSelector((store) => store.auth.user);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [online, setOnline] = useState<BackendUserT[]>([]);
  const [messages, setMessages] = useState<ChatType[]>([]);
  const soketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const soket = new WebSocket(`ws://localhost:3000?receiverId=${receiverId}`);
    soketRef.current = soket;

    soket.onopen = () => {
      console.log('CONNECTED');
      const initialMessage = JSON.stringify({
        type: 'INITIALIZE',
        payload: { receiverId },
      });
      soket.send(initialMessage);
    };
    soket.onclose = () => console.log('DISCONNECTED');
    soket.onerror = (err) => console.log('ERROR', err);

    soket.onmessage = (event: MessageEvent) => {
      const action: Action = JSON.parse(event.data as string) as Action;
      const { type, payload } = action;

      switch (type) {
        case 'SET_USERS':
          setOnline(payload as BackendUserT[]);
          break;
        case 'SET_MESSAGES':
        case 'NEW_MESSAGES':
          setMessages(payload as ChatType[]);
          break;
        case 'ADD_MESSAGE':
          setMessages((prevMessages) => [...prevMessages, payload as ChatType]);
          break;
        default:
          break;
      }
    };

    return () => {
      soketRef.current?.close();
    };
  }, [receiverId]);

  const sendNewMessage = (message: string): void => {
    if (soketRef.current && receiverId) {
      const action: Action = {
        type: 'ADD_MESSAGE',
        payload: { text: message, receiverId: +receiverId},
      };
      soketRef.current.send(JSON.stringify(action));
    }
  };

  if (user.status === UserStatus.Pending || user.status === UserStatus.Guest) {
    return <h1>Loading...</h1>;
  }

  return (
    <Container p={4} maxW="container.xl" display="flex" justifyContent="center" height="100vh">
      <Grid
        templateColumns={{ base: '1fr', md: '1fr 2fr' }}
        gap={6}
        w="100%"
        h="100%"
        templateRows="1fr"
      >
        <GridItem
          bg="#cacae2"
          p={4}
          borderRadius="md"
          boxShadow="2xl"
          display="flex"
          flexDirection="column"
          alignItems="center"
          h="50svh"
          overflowY="auto"
        >
          <Box
            borderRadius="full"
            overflow="hidden"
            boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
            transition="transform 0.3s ease"
            _hover={{ transform: 'scale(1.05)' }}
          >
            <Image
              w="150px"
              h="150px"
              src={
                user?.UserProfile?.photo
                  ? user?.UserProfile?.photo
                  : 'https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png'
              }
              alt="User Avatar"
            />
          </Box>
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="white"
            mt={4}
            textShadow="1px 1px 2px rgba(0, 0, 0, 0.6)"
          >
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
        </GridItem>

        <GridItem
          bg="#cacae2"
          borderRadius="md"
          boxShadow="2xl"
          display="flex"
          flexDirection="column"
          h="50vh"
        >
          <Box flex="1" overflowY="auto" borderRadius="md" bg="#d8d8ed" p={4}>
            <ChatComponent messages={messages} /> 
          </Box>
          <ChatInput onSendMessage={sendNewMessage} />
        </GridItem>
      </Grid>
    </Container>
  );
}
