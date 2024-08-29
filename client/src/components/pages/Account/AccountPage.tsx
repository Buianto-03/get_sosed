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
  Icon,
  FormControl,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaThumbsUp } from 'react-icons/fa';
import type { Action } from '@reduxjs/toolkit';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import ChatList from '../../ui/chat/ChatList';
import { UserStatus, type BackendUserT } from '../../../types/auth';
import type { ChatType } from '../../../types/chat';
import { editUserProfileThunk } from '../../../redux/slices/userProfile/thunks';
import { checkAuthThunk } from '../../../redux/slices/auth/thunks';
import { getReceiverListThunk } from '../../../redux/slices/chat/thunks';
import { getLikedAdvertsThunk } from '../../../redux/slices/adverts/advertsThunk';
import { deleteLikeThunk } from '../../../redux/slices/likes/likesThunk';

export default function AccountPage(): JSX.Element {
  const user = useAppSelector((store) => store.auth.user);
  const likedAdverts = useAppSelector((store) => store.advert?.liked);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [online, setOnline] = useState<BackendUserT[]>([]);
  const [messages, setMessages] = useState<ChatType[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState({
    age: '',
    phoneNumber: '',
    photo: '',
    about: '',
  });
  const [errors, setErrors] = useState({
    photo: '',
    age: '',
    phoneNumber: '',
    about: '',
  });
  const soketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (user.status === UserStatus.Logged) {
      const soket = new WebSocket('ws://localhost:3000');
      soketRef.current = soket;

      soket.onopen = async () => {
        console.log('CONNECTED');
        try {
          await dispatch(getReceiverListThunk(user.id));
        } catch (error) {
          console.log(error); // Обрабатываем ошибку
        }
      };
      soket.onclose = () => console.log('DISCONNECTED');
      soket.onerror = (err) => console.log('ERROR', err);

      soket.onmessage = (event: MessageEvent) => {
        const action: Action = JSON.parse(event.data as string) as Action;
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
    }

    void dispatch(checkAuthThunk()).then(() => void dispatch(getLikedAdvertsThunk()));

    return () => {
      soketRef.current?.close();
    };
  }, []);

  const receivers = useAppSelector((store) => store.chatList.chatList);

  const handleEditProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));

    // Simple validation checks
    if (name === 'photo') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        photo: '',
      }));
    }

    if (name === 'age') {
      const ageValue = parseInt(value, 10);
      if (Number.isNaN(ageValue) || ageValue < 18 || ageValue > 100) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          age: 'Age must be a number between 18 and 100.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          age: '',
        }));
      }
    }

    if (name === 'phoneNumber') {
      const phonePattern = /^\+?[1-9]\d{1,14}$/; // Basic international phone number pattern
      if (!phonePattern.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          phoneNumber: 'Invalid phone number format.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          phoneNumber: '',
        }));
      }
    }

    if (name === 'about') {
      if (value.length < 10) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          about: 'About section must be at least 10 characters long.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          about: '',
        }));
      }
    }
  };

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!errors.photo && !errors.age && !errors.phoneNumber && !errors.about) {
      const formData = Object.fromEntries(new FormData(e.currentTarget));
      if (user.status === UserStatus.Logged) {
        void dispatch(editUserProfileThunk({ formData, id: user.id })).then(() =>
          dispatch(checkAuthThunk()),
        );
        console.log('Profile updated:', editProfile);
        setIsEditing(false);
      }
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
              <Box as="form" onSubmit={handleSaveProfile}>
                <FormControl isInvalid={!!errors.photo}>
                  <Input
                    name="photo"
                    value={editProfile.photo}
                    onChange={handleEditProfileChange}
                    mb={2}
                    type="url"
                    bg="white"
                    placeholder="Photo URL"
                  />
                  <FormErrorMessage>{errors.photo}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.age}>
                  <Input
                    name="age"
                    type="number"
                    value={editProfile.age}
                    onChange={handleEditProfileChange}
                    mb={2}
                    bg="white"
                    placeholder="Age"
                  />
                  <FormErrorMessage>{errors.age}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.about}>
                  <Input
                    name="about"
                    value={editProfile.about}
                    onChange={handleEditProfileChange}
                    mb={2}
                    type="text"
                    bg="white"
                    placeholder="About"
                  />
                  <FormErrorMessage>{errors.about}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.phoneNumber}>
                  <Input
                    name="phoneNumber"
                    value={editProfile.phoneNumber}
                    onChange={handleEditProfileChange}
                    mb={2}
                    type="tel"
                    bg="white"
                    placeholder="Phone Number"
                  />
                  <FormErrorMessage>{errors.phoneNumber}</FormErrorMessage>
                </FormControl>
                <Button type="submit" colorScheme="teal" mb={2}>
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} colorScheme="gray" mb={2} ml={2}>
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
          <ChatList receivers={receivers} online={online} />
        </GridItem>
        <GridItem
          rowSpan={{ base: 1, md: 2 }}
          colSpan={{ base: 1, md: 2 }}
          bg="#cacae2"
          borderRadius="md"
          boxShadow="lg"
          display="flex"
          flexDirection="column"
          overflowY="auto" // Enable vertical scrolling
        >
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Liked Adverts
          </Text>
          {likedAdverts.length === 0 ? (
            <Text>No liked adverts found.</Text>
          ) : (
            likedAdverts.map((advert) => (
              <Box p={2} key={advert.id}>
                <Box
                  mb={4}
                  p={4}
                  onClick={() => navigate(`/advert/${advert.id}`)}
                  cursor="pointer"
                  bg="white"
                  borderRadius="md"
                  boxShadow="md"
                >
                  <Text fontSize="lg" fontWeight="bold">
                    {advert.Advert.title}
                  </Text>
                  <Text>{advert.Advert.body}</Text>
                  <Text color="gray.500">Price: {advert.Advert.price}₽</Text>
                  <Text color="gray.500" marginBottom={2}>
                    Location: {advert.Advert.Location.city}, {advert.Advert.Location.district},{' '}
                    {advert.Advert.Location.metro}, {advert.Advert.Location.address}
                  </Text>
                </Box>
                <Icon
                  as={FaThumbsUp}
                  boxSize={6}
                  cursor="pointer"
                  onClick={(e) => {
                    if (user.status === UserStatus.Logged) {
                      void dispatch(deleteLikeThunk(advert.id));
                      void dispatch(getLikedAdvertsThunk()).catch(console.log('olol'));
                    }
                    return false;
                  }}
                />
              </Box>
            ))
          )}
        </GridItem>
      </Grid>
    </Container>
  );
}
