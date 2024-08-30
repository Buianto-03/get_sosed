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
import { useNavigate, useParams } from 'react-router-dom';
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import type { AdvertType } from '../../../types/advert';
import {
  deleteLikeThunk,
  getLikesThunk,
  setLikeThunk,
} from '../../../redux/slices/likes/likesThunk';
import LikeProfile from '../../ui/advertPageUI/LikeProfile';
import PhotosCarousel from '../../ui/advertPageUI/PhotosCarousel';
import { UserStatus } from '../../../types/auth';
import YMap from '../../ui/advertPageUI/YMap';
import { getAdvertByIdThunk } from '../../../redux/slices/adverts/advertsThunk';

export default function AdvertPage(): JSX.Element {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const advert = useAppSelector((store) => store.advert.chosenAdvert);
  const likes = useAppSelector((store) => store.likes.likes);
  const user = useAppSelector((store) => store.auth.user);
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      void dispatch(getAdvertByIdThunk(+id)).then((res) => {
        const advertId = res.payload as AdvertType;
        void dispatch(getLikesThunk(advertId.id));
      });
    }
    window.scrollTo(0, 0);
  }, [dispatch, id]);

  const isLiked = (): boolean =>
    user.status === UserStatus.Logged && advert
      ? likes.some((like) => like.userId === user.id && like.advertId === advert.id)
      : false;

  const likeHandler: React.MouseEventHandler<HTMLButtonElement> = () => {
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
              {/* <Image src="/images/1.jpg" /> */}
              <PhotosCarousel photos={advert.AdvertPhotos} />
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
                size="lg"
                onClick={() => 
                  user.status === UserStatus.Logged && user.id === advert.userId
                    ? navigate(`/advert/${advert.id}`)
                    : navigate(`/chat/${advert.userId}`)
                }
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
        <YMap location={advert.Location.coordinates} />
      </Container>
    </>
  ) : (
    <Container p={6} maxW="container.xl" display="flex" justifyContent="center">
      <Text>Объявление не найдено</Text>
    </Container>
  );
}
