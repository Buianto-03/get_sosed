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
  useDisclosure,
  FormLabel,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaThumbsUp } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import ChatList from '../../ui/chat/ChatList';
import { UserStatus } from '../../../types/auth';
import type { BackendUserT } from '../../../types/auth';
import type { ChatType } from '../../../types/chat';
import { editUserProfileThunk } from '../../../redux/slices/userProfile/thunks';
import { checkAuthThunk } from '../../../redux/slices/auth/thunks';
import { getReceiverListThunk } from '../../../redux/slices/chat/thunks';
import { getLikedAdvertsThunk } from '../../../redux/slices/adverts/advertsThunk';
import DeleteModalConfirm from '../../ui/Modal/ConfirmDeleteModal';
import { setSelectedLike } from '../../../redux/slices/likes/likesSlice';

type ChatTypePayload = {
  type: 'SET_USERS' | 'SET_MESSAGES' | 'NEW_MESSAGES';
  payload: ChatType[] | BackendUserT[];
};

type Action = ChatTypePayload;

export default function AccountPage(): JSX.Element {
  const user = useAppSelector((store) => store.auth.user);
  const likedAdverts = useAppSelector((store) => store.advert?.liked);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);

  const { onOpen, onClose } = useDisclosure({
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => {
      setIsOpen(false);
      if (user.status === UserStatus.Logged) {
        void dispatch(getLikedAdvertsThunk()).catch(() => console.log('olol'));
      }
      return false;
    },
  });
  const [online, setOnline] = useState<BackendUserT[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messages, setMessages] = useState<ChatType[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState({
    age: '',
    phoneNumber: '',
    about: '',
  });
  const [errors, setErrors] = useState({
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
            setOnline(payload as BackendUserT[]);
            break;
          case 'SET_MESSAGES':
            setMessages(payload as ChatType[]);
            break;
          case 'NEW_MESSAGES':
            setMessages(payload as ChatType[]);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.status, dispatch]);

  const receivers = useAppSelector((store) => store.chatList.chatList);

  useEffect(() => {
    if (isEditing && user.status === UserStatus.Logged && user.UserProfile) {
      setEditProfile({
        age: user.UserProfile.age?.toString() || '',
        phoneNumber: user.UserProfile.phoneNumber || '',
        about: user.UserProfile.about || '',
      });
    }
  }, [isEditing, user]);

  const handleEditProfileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));

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
    if (!errors.age && !errors.phoneNumber && !errors.about) {
      const formData = new FormData(e.currentTarget);
      if (user.status === UserStatus.Logged) {
        formData.append('id', user.id.toString());
        void dispatch(editUserProfileThunk(formData)).then(() => dispatch(checkAuthThunk()));
        console.log('Profile updated:', editProfile);
        setIsEditing(false);
      }
    }
  };

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
          bg="#CACAE2"
          p={4}
          borderRadius="md"
          boxShadow="lg"
        >
          <VStack spacing={2} alignItems="center" mt={4}>
            {isEditing ? (
              <Box as="form" onSubmit={handleSaveProfile}>
                <FormControl>
                  <Image
                    borderRadius="full"
                    mb={4}
                    ml={{ base: 24, md: 20 }}
                    maxW={{ base: '100px', md: '150px' }}
                    maxH={{ base: '100px', md: '150px' }}
                    w="100%"
                    h="auto"
                    src={
                      user.status === UserStatus.Logged && user.UserProfile?.photo
                        ? user.UserProfile.photo
                        : 'https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png'
                    }
                    alt="User Avatar"
                  />
                  <Input type="file" name="photo" id="photo" display="none" />
                  <FormLabel
                    htmlFor="photo"
                    mb={2}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.300"
                    borderRadius="md"
                    px={4}
                    py={2}
                    cursor="pointer"
                    display="inline-block"
                    width="auto"
                  >
                    Выберите фото
                  </FormLabel>
                </FormControl>
                <FormControl isInvalid={!!errors.age}>
                  <Input
                    name="age"
                    type="number"
                    value={editProfile.age}
                    onChange={handleEditProfileChange}
                    mb={2}
                    bg="white"
                    placeholder="Возраст"
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
                    placeholder="О себе"
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
                    placeholder="Номер телефона"
                  />
                  <FormErrorMessage>{errors.phoneNumber}</FormErrorMessage>
                </FormControl>
                <Button type="submit" colorScheme="teal" mb={2}>
                  Сохранить
                </Button>
                <Button onClick={() => setIsEditing(false)} colorScheme="gray" mb={2}>
                  Отменить
                </Button>
              </Box>
            ) : (
              <Box textAlign="center">
                {user.status === UserStatus.Logged && (
                  <>
                    <Image
                      borderRadius="full"
                      mb={4}
                      ml={{ base: 10, md: 3 }}
                      maxW={{ base: '100px', md: '150px' }}
                      maxH={{ base: '100px', md: '150px' }}
                      w={{ base: '100px', md: '150px' }} // Устанавливаем фиксированную ширину
                      h={{ base: '100px', md: '150px' }}
                      src={
                        user.status === UserStatus.Logged && user.UserProfile?.photo
                          ? user.UserProfile.photo
                          : 'https://png.pngtree.com/png-vector/20220709/ourmid/pngtree-businessman-user-avatar-wearing-suit-with-red-tie-png-image_5809521.png'
                      }
                      alt="User Avatar"
                    />
                    {user.status === UserStatus.Logged && user.UserProfile ? (
                      <>
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
                          Возраст: {user.UserProfile?.age}
                        </Text>
                        <Text fontSize="sm" color="whiteAlpha.700">
                          Пол: {user.UserProfile?.gender}
                        </Text>
                      </>
                    ) : (
                      <div />
                    )}
                    <Button mt={4} onClick={() => setIsEditing(true)} colorScheme="gray">
                      Изменить профиль
                    </Button>
                  </>
                )}
              </Box>
            )}
            <Button mt={4} colorScheme="gray" onClick={() => navigate('/post')}>
              Разместить объявление
            </Button>
          </VStack>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 2 }} bg="#F3F3FF" borderRadius="md" boxShadow="lg">
          <ChatList receivers={receivers} online={online} />
        </GridItem>
        <GridItem
          rowSpan={{ base: 1, md: 2 }}
          colSpan={{ base: 1, md: 2 }}
          bg="#F3F3FF"
          borderRadius="md"
          boxShadow="lg"
          display="flex"
          flexDirection="column"
          overflowY="auto" // Enable vertical scrolling
        >
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Избранные объявления
          </Text>
          {likedAdverts.length === 0 ? (
            <Text>Нет избранных объявлений.</Text>
          ) : (
            likedAdverts.map((like) => (
              <Box p={2} key={like.id}>
                <Box
                  mb={4}
                  p={4}
                  onClick={() => navigate(`/advert/${like.advertId}`)}
                  cursor="pointer"
                  bg="white"
                  borderRadius="md"
                  boxShadow="md"
                >
                  <Text fontSize="lg" fontWeight="bold">
                    {like.Advert.title}
                  </Text>
                  <Text>{like.Advert.body}</Text>
                  <Text color="gray.500">Price: {like.Advert.price}₽</Text>
                  <Text color="gray.500" marginBottom={2}>
                    Расположение: {like.Advert.Location.city}, {like.Advert.Location.district},{' '}
                    {like.Advert.Location.metro}, {like.Advert.Location.address}
                  </Text>
                  <Icon
                    as={FaThumbsUp}
                    boxSize={6}
                    color="#CACAE2"
                    cursor="pointer"
                    onClick={(e) => {
                      void dispatch(setSelectedLike(like));
                      e.stopPropagation();
                      onOpen();
                    }}
                  />
                </Box>
              </Box>
            ))
          )}
        </GridItem>
      </Grid>
      <DeleteModalConfirm isOpen={isOpen} onClose={onClose} />
    </Container>
  );
}
