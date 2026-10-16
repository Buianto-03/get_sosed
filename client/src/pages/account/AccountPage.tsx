import React, { useEffect } from 'react';
import { Container, Grid, GridItem, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { UserStatus } from '@entities/session/model/auth';
import { getReceiverListThunk } from '@entities/chat/model/thunks';
import { getLikedAdvertsThunk } from '@features/liked-adverts/model';
import ChatList from '@widgets/chat-list/ChatList';
import LikedAdverts from '@widgets/liked-adverts/LikedAdverts';
import ProfileCard from '@widgets/profile-card/ProfileCard';
import { routes } from '@shared/config/routes';

export default function AccountPage(): JSX.Element {
  const user = useAppSelector((state) => state.auth.user);
  const chatList = useAppSelector((state) => state.chatList.chatList);
  const online = useAppSelector((state) => state.chatList.online);
  const userId = user.status === UserStatus.Logged ? user.id : null;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (userId === null) return;
    void dispatch(getReceiverListThunk(userId));
    void dispatch(getLikedAdvertsThunk());
  }, [dispatch, userId]);

  if (user.status !== UserStatus.Logged) return <Text>Загрузка профиля...</Text>;

  return (
    <Container p={4} maxW="container.xl">
      <Grid templateColumns={{ base: '1fr', md: '1fr 2fr 2fr' }} gap={4} minH="650px">
        <GridItem>
          <ProfileCard user={user} onPost={() => navigate(routes.listingCreate)} />
        </GridItem>
        <GridItem bg="#F3F3FF" borderRadius="md">
          <ChatList receivers={chatList} online={online} />
        </GridItem>
        <GridItem>
          <LikedAdverts onOpenAdvert={(id) => navigate(routes.listingDetails(id))} />
        </GridItem>
      </Grid>
    </Container>
  );
}
