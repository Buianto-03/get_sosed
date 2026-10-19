import React, { useEffect, useState } from 'react';
import { Grid, GridItem, Container, Avatar, Text, Box } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import ChatComponent from '@widgets/chat-window/ChatComponent';
import ChatInput from '@features/send-message/ChatInput';
import { UserStatus } from '@entities/session/model/authModel';
import { chatSocket } from '@entities/chat/model/socket';
import { getReceiverListThunk } from '@entities/chat/model/chatListThunk';

export default function ChatPage(): JSX.Element {
  const { receiverId } = useParams<{ receiverId: string }>();
  const user = useAppSelector((store) => store.auth.user);
  const chatList = useAppSelector((store) => store.chatList.chatList);
  const dispatch = useAppDispatch();
  const userId = user.status === UserStatus.Logged ? user.id : null;
  const peerId = Number(receiverId);
  const conversation = chatList.find((chat) =>
    (chat.senderId === userId && chat.receiverId === peerId)
    || (chat.receiverId === userId && chat.senderId === peerId));
  const peer = conversation?.senderId === peerId ? conversation.sender : conversation?.receiver;
  const messages = useAppSelector((store) => store.chatList.messagesByUser[peerId] ?? []);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    if (!Number.isInteger(peerId) || peerId <= 0) return undefined;
    chatSocket.openDialog(peerId);
    return () => chatSocket.closeDialog(peerId);
  }, [peerId]);

  useEffect(() => {
    if (userId !== null) void dispatch(getReceiverListThunk(userId));
  }, [dispatch, userId]);

  const sendNewMessage = (message: string): boolean => {
    const sent = chatSocket.sendMessage(peerId, message);
    setSendError(sent ? '' : 'Нет соединения. Повторите отправку.');
    return sent;
  };

  if (user.status === UserStatus.Pending || user.status === UserStatus.Guest) {
    return <h1>Loading...</h1>;
  }
  if (!Number.isInteger(peerId) || peerId <= 0) return <Text>Некорректный собеседник.</Text>;

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
          <Avatar size="2xl" name={peer?.name ?? `Сосед ${peerId}`} />
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="white"
            mt={4}
            textShadow="1px 1px 2px rgba(0, 0, 0, 0.6)"
          >
            {peer?.name ?? `Сосед ${peerId}`}
          </Text>
          <Text fontSize="md" color="whiteAlpha.800">
            {peer?.email}
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
          {sendError && <Text role="alert" color="red.500">{sendError}</Text>}
        </GridItem>
      </Grid>
    </Container>
  );
}
