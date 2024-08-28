import React, { useEffect, useRef, useState } from 'react';
import {
  Grid,
  GridItem,
  Container,
  Image,
  Text,
  VStack,
  Button,
  Input,
  Box,
} from '@chakra-ui/react';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import ChatList from '../../ui/chat/ChatList';
import { UserStatus, type BackendUserT } from '../../../types/auth';
import type { ChatType } from '../../../types/chat';
import { editUserProfileThunk } from '../../../redux/slices/userProfile/thunks';
import type { UserProfileT } from '../../../types/userProfile';
import { checkAuthThunk } from '../../../redux/slices/auth/thunks';

type Action = {
  type: string;
  payload: any;
};

export default function AccountPage(): JSX.Element {
  const user = useAppSelector((store) => store.auth.user);
  console.log(user.id);

  const { age, phoneNumber, photo, about } = useAppSelector((store) => store.userProfile);
  const dispatch = useAppDispatch();
  const [online, setOnline] = useState<BackendUserT[]>([]);
  const [messages, setMessages] = useState<ChatType[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState({
    age: age || '',
    phoneNumber: phoneNumber || '',
    photo: photo || '',
    about: about || '',
  });
  const soketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const soket = new WebSocket('ws://localhost:3000');
    soketRef.current = soket;

    soket.onopen = () => console.log('CONNECTED');
    soket.onclose = () => console.log('DISCONNECTED');
    soket.onerror = (err) => console.log('ERROR', err);

    soket.onmessage = (event: MessageEvent) => {
      const action: Action = JSON.parse(event.data);
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
        default:
          break;
      }
    };

    return () => {
      soketRef.current?.close();
    };
  }, []);

  const handleEditProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleSaveProfile = (formData: UserProfileT): void => {
    if (user.status === UserStatus.Logged) {
      void dispatch(editUserProfileThunk({ formData, id: user.id })).then(() =>
        dispatch(checkAuthThunk()),
      );
      console.log('Profile updated:', editProfile);
      setIsEditing(false);
    }
  };

  if (user.status === UserStatus.Pending || user.status === UserStatus.Guest)
    return <h1>Loading...</h1>;

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
          bg="#cacae2"
          p={4}
          borderRadius="md"
          boxShadow="lg"
        >
          <VStack spacing={2} alignItems="center" mt={4}>
            {isEditing ? (
              <Box
                as="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = Object.fromEntries(new FormData(e.currentTarget));
                  handleSaveProfile(formData);
                  e.currentTarget.reset();
                }}
              >
                <Input
                  name="photo"
                  value={editProfile.photo}
                  onChange={handleEditProfileChange}
                  mb={2}
                  placeholder="Photo URL"
                />
                <Input
                  name="age"
                  value={editProfile.age}
                  onChange={handleEditProfileChange}
                  mb={2}
                  placeholder="Age"
                />
                <Input
                  name="about"
                  value={editProfile.about}
                  onChange={handleEditProfileChange}
                  mb={2}
                  placeholder="About"
                />
                <Input
                  name="phoneNumber"
                  value={editProfile.phoneNumber}
                  onChange={handleEditProfileChange}
                  mb={2}
                  placeholder="Phone Number"
                />
                <Button type="submit" colorScheme="teal" mb={2}>
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} colorScheme="gray">
                  Cancel
                </Button>
              </Box>
            ) : (
              <Box textAlign="center">
                <Image
                  borderRadius="full"
                  mb={4}
                  maxW={{ base: '100px', md: '150px' }}
                  maxH={{ base: '100px', md: '150px' }}
                  w="100%"
                  h="auto"
                  src={
                    user.UserProfile?.photo
                      ? user.UserProfile?.photo
                      : 'https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png'
                  }
                  alt="User Avatar"
                />
                <Text fontSize="lg" fontWeight="bold" color="white">
                  {user.name}
                </Text>
                <Text fontSize="md" color="whiteAlpha.800">
                  {user.email}
                </Text>
                <Text fontSize="sm" color="whiteAlpha.700">
                  {user.UserProfile?.about}
                </Text>
                <Text fontSize="sm" color="whiteAlpha.700">
                  Age: {user.UserProfile?.age}
                </Text>
                <Text fontSize="sm" color="whiteAlpha.700">
                  Gender: {user.UserProfile?.gender}
                </Text>
                <Button mt={4} onClick={() => setIsEditing(true)} colorScheme="teal">
                  Edit Profile
                </Button>
              </Box>
            )}
            <Button mt={4} colorScheme="teal">
              Разместить объявление
            </Button>
          </VStack>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 2 }} bg="#cacae2" borderRadius="md" boxShadow="lg">
          <ChatList online={online} />
        </GridItem>
        <GridItem
          rowSpan={{ base: 1, md: 2 }}
          colSpan={{ base: 1, md: 2 }}
          bg="#cacae2"
          borderRadius="md"
          boxShadow="lg"
          display="flex"
          flexDirection="column"
        >
          <Text>Выберите собеседника</Text>
        </GridItem>
      </Grid>
    </Container>
  );
}
