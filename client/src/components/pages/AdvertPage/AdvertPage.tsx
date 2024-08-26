import {
  Container,
  Grid,
  GridItem,
  Box,
  Text,
  Heading,
  Divider,
  VStack,
  Button,
  Icon,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
import type { YMapLocationRequest } from 'ymaps3';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import type { AdvertType } from '../../../types/advert';
import { setChosenAdvert } from '../../../redux/slices/adverts/advertsSlice';
import {
  deleteLikeThunk,
  getLikesThunk,
  setLikeThunk,
} from '../../../redux/slices/likes/likesThunk';
import LikeProfile from '../../ui/advertPageUI/LikeProfile';
import PhotosCarousel from '../../ui/advertPageUI/PhotosCarousel';
import { UserStatus } from '../../../types/auth';

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
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const advert = useAppSelector((store) => store.advert.chosenAdvert);
  const likes = useAppSelector((store) => store.likes.likes);
  const user = useAppSelector((store) => store.auth.user);
  async function initMap(): Promise<void> {
    await ymaps3.ready;

    const LOCATION: YMapLocationRequest = {
      center: [37.623082, 55.75254],
      zoom: 9,
    };

    const { YMap, YMapDefaultSchemeLayer } = ymaps3;

    const map = new YMap(document.getElementById('map'), { location: LOCATION });
    map.addChild(new YMapDefaultSchemeLayer({}));
  }

  useEffect(() => {
    void dispatch(setChosenAdvert(mock));
    if (advert) {
      void dispatch(getLikesThunk(advert.id));
    }
    void initMap();
  }, [advert, dispatch]);

  const isLiked = (): boolean =>
    user.status === UserStatus.Logged && advert
      ? likes.some((like) => like.userId === user.id && like.advertId === advert.id)
      : false;

  const likeHandler: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (user.status === UserStatus.Logged && advert) {
      return !isLiked()
        ? void dispatch(setLikeThunk(advert.id))
        : void dispatch(deleteLikeThunk(advert.id));
    }
    return false;
  };

  return advert ? (
    <>
      <Container p={6} maxW="container.xl" display="flex" justifyContent="center">
        <Grid h="auto" w="100%" templateColumns="repeat(5, 1fr)" gap={6}>
          <GridItem colSpan={3}>
            <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={6} bg="white">
              <PhotosCarousel />
              {/* <Image src="/images/1pic.jpg" alt="/assets/images/1pic.jpg" /> */}
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
              <Button
                colorScheme="teal"
                // bgColor="00CEC9"
                size="lg"
                onClick={() => navigate('/')}
                mr={5}
              >
                Написать соседу
              </Button>
              <Button variant="ghost" colorScheme="blue" mr={2} onClick={(e) => likeHandler(e)}>
                {!isLiked() ? (
                  <Icon as={FaThumbsUp} boxSize={6} />
                ) : (
                  <Icon as={FaThumbsDown} boxSize={6} />
                )}
              </Button>

              <Divider my={4} />
              <Heading as="h3" mb={3} size="md">
                Нравится:
              </Heading>
              {likes.map((like) => (
                <LikeProfile key={like.id} like={like} />
              ))}
            </Box>
          </GridItem>
        </Grid>
      </Container>
      <Container p={6} maxW="container.xl" display="flex" justifyContent="center">
        <div id="map" style={{ width: '100%', height: '600px' }} />
      </Container>
    </>
  ) : (
    <Container p={6} maxW="container.xl" display="flex" justifyContent="center">
      <Text>Объявление не найдено</Text>
    </Container>
  );
}
