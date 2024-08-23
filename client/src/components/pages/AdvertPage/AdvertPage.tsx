import {
  Container,
  Grid,
  GridItem,
  Box,
  Text,
  Heading,
  Image,
  Divider,
  VStack,
  Button,
  ButtonGroup,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import type { AdvertType } from '../../../types/advert';
import { setChosenAdvert } from '../../../redux/slices/adverts/advertsSlice';

const mock: AdvertType = {
  id: 1,
  title: 'Уютная квартира в центре',
  body: 'Современная квартира с одной спальней и балконом.',
  userId: 1,
  price: 50000,
  rooms: 2,
  floor: 4,
  square: 70,
  createdAt: '2024-08-22T08:47:48.162Z',
  updatedAt: '2024-08-22T08:47:48.162Z',
  User: {
    id: 1,
    name: 'Admin',
    email: 'admin@1.com',
    roleId: 1,
  },
  Location: {
    id: 1,
    city: 'Москва',
    district: 'Центральный',
    address: 'Тверская улица, 10',
    metro: 'Театральная',
    coordinates: '55.7585, 37.6219',
    advertId: 1,
  },
};

export default function AdvertPage(): JSX.Element {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setChosenAdvert(mock));
  }, [dispatch]);
  const advert = useAppSelector((store) => store.advert.chosenAdvert);
  const navigate = useNavigate();

  if (!advert) {
    return (
      <Container p={6} maxW="container.xl" display="flex" justifyContent="center" height="100svh">
        <Text>Объявление не найдено</Text>
      </Container>
    );
  }

  return (
    <Container p={6} maxW="container.xl" display="flex" justifyContent="center" height="100svh">
      <Grid h="auto" w="100%" templateColumns="repeat(5, 1fr)" gap={6}>
        <GridItem colSpan={3}>
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={6} bg="white">
            <Image src="https://via.placeholder.com/600" alt={advert.title} />
            <Heading as="h2" size="lg" mb={4} pt={5}>
              О квартире
            </Heading>
            <Text mt={2}>Комнаты: {advert.rooms}</Text>
            <Text mt={2}>Площадь: {advert.square}</Text>
            <Text mt={2}>Этаж: {advert.floor}</Text>
            <Heading as="h2" size="lg" mb={4} pt={5}>
              Расположение
            </Heading>
            <VStack align="start" spacing={2}>
              <Text>Город: {advert.Location.city}</Text>
              <Text>Район: {advert.Location.district}</Text>
              <Text>Адрес: {advert.Location.address}</Text>
              <Text>Метро: {advert.Location.metro}</Text>
            </VStack>
          </Box>
        </GridItem>
        <GridItem colSpan={2}>
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={6} bg="white">
            <Heading as="h1" size="xl" mt={4}>
              {advert.title}
            </Heading>
            <Text mt={2}>{advert.body}</Text>
            <Heading mt={2} fontWeight="bold">
              Цена: {advert.price} руб.
            </Heading>
            <br />
            <Heading as="h2" size="lg" mb={4}>
              Информация о владельце
            </Heading>
            <VStack align="start" spacing={2}>
              <Text>Имя: {advert.User.name}</Text>
              <Text>Email: {advert.User.email}</Text>
            </VStack>
            <Button colorScheme="teal" size="lg" onClick={() => navigate('/')}>
              Написать соседу
            </Button>
            <Divider my={4} />
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
}
